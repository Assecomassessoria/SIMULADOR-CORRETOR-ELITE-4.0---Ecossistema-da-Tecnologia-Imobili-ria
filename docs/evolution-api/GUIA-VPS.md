# Guia: Subir Evolution API em VPS com Docker + Caddy (HTTPS automático)

Tempo estimado: **30 a 45 minutos**.
Resultado: `https://evolution.seudominio.com.br` respondendo ao Simulador Elite, com QR Code funcionando para qualquer corretor.

---

## 1. Pré-requisitos

| Item | Especificação mínima | Observação |
|---|---|---|
| VPS | 2 vCPU, 2 GB RAM, 20 GB SSD | Ubuntu 22.04 LTS recomendado |
| IP público fixo (IPv4) | Sim | Anote — vai no DNS |
| Domínio ou subdomínio | Ex.: `evolution.assecomassessoria.net.br` | Pode usar Cloudflare, mas em **modo DNS only (nuvem cinza)** |
| Portas liberadas no firewall | 22, 80, 443 | Não precisa abrir a 8080 publicamente |

> **Importante**: o IP `185.158.133.1` é da Lovable, não da sua VPS. Para descobrir o IP real:
> ```bash
> curl -4 ifconfig.me
> ```

---

## 2. Configurar o DNS

No seu registrar (Registro.br, GoDaddy, Cloudflare, etc.):

| Tipo | Nome | Valor | Proxy |
|---|---|---|---|
| A | `evolution` | `IP_PÚBLICO_DA_VPS` | **Desativado (DNS only)** |

Aguarde 5–10 minutos e teste:
```bash
dig +short evolution.seudominio.com.br
# deve retornar o IP da sua VPS
```

---

## 3. Preparar a VPS

Conecte via SSH (`ssh root@SEU_IP`) e rode:

```bash
# Atualizar pacotes
apt update && apt upgrade -y

# Instalar Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin ufw

# Firewall mínimo
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Diretório do projeto
mkdir -p /opt/evolution && cd /opt/evolution
```

---

## 4. Gerar uma chave-mestra forte

```bash
openssl rand -hex 32
```
Copie o resultado — vamos usá-lo em **2 lugares** (no `docker-compose.yml` E no secret `EVOLUTION_API_KEY` do Lovable).

---

## 5. Criar `docker-compose.yml`

```bash
nano /opt/evolution/docker-compose.yml
```

Cole:

```yaml
services:
  evolution-db:
    image: postgres:15-alpine
    container_name: evolution_postgres
    restart: always
    environment:
      POSTGRES_USER: elite_user
      POSTGRES_PASSWORD: TROQUE_ESTA_SENHA_DO_BANCO
      POSTGRES_DB: evolution_metadata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution_net

  evolution-api:
    image: evoapicloud/evolution-api:latest
    container_name: evolution_api_server
    restart: always
    depends_on:
      - evolution-db
    ports:
      - "127.0.0.1:8080:8080"   # só localhost — Caddy faz o proxy
    environment:
      - SERVER_URL=https://evolution.seudominio.com.br
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://elite_user:TROQUE_ESTA_SENHA_DO_BANCO@evolution-db:5432/evolution_metadata?schema=public
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=COLE_AQUI_A_CHAVE_DO_PASSO_4
      - CONFIG_SESSION_PHONE_CLIENT=Simulador Elite
      - QRCODE_LIMIT=30
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
    volumes:
      - evolution_instances:/evolution/instances
    networks:
      - evolution_net

  caddy:
    image: caddy:2-alpine
    container_name: evolution_caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - evolution_net
    depends_on:
      - evolution-api

volumes:
  postgres_data:
  evolution_instances:
  caddy_data:
  caddy_config:

networks:
  evolution_net:
    driver: bridge
```

> Substitua **3 valores**: `TROQUE_ESTA_SENHA_DO_BANCO` (em 2 lugares — devem ser iguais), `COLE_AQUI_A_CHAVE_DO_PASSO_4`, e `evolution.seudominio.com.br`.

---

## 6. Criar `Caddyfile` (HTTPS automático via Let's Encrypt)

```bash
nano /opt/evolution/Caddyfile
```

```
evolution.seudominio.com.br {
    reverse_proxy evolution-api:8080
    encode gzip

    # Headers de segurança básicos
    header {
        Strict-Transport-Security "max-age=31536000;"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

Caddy emite e renova certificado SSL **sozinho** — não precisa rodar Certbot.

---

## 7. Subir os containers

```bash
cd /opt/evolution
docker compose up -d
docker compose logs -f caddy   # acompanhe a emissão do certificado (Ctrl+C para sair)
```

Aguarde a mensagem `certificate obtained successfully`.

Teste:
```bash
curl https://evolution.seudominio.com.br
# Resposta esperada: {"status":200,"message":"Welcome to the Evolution API..."}
```

---

## 8. Conectar o Simulador Elite

No Lovable, atualize **2 secrets** (Configurações → Backend → Secrets):

| Secret | Valor |
|---|---|
| `EVOLUTION_API_URL` | `https://evolution.seudominio.com.br` |
| `EVOLUTION_API_KEY` | a chave gerada no passo 4 |

**Não precisa redeploy.** Edge functions leem o secret na próxima chamada.

---

## 9. Validar do lado do simulador

1. Logue como corretor
2. Vá em **Marketing → Conexões** (ou clique em **Conectar WA** na barra do simulador)
3. Clique em **Gerar QR Code**
4. Abra o WhatsApp do celular → **Aparelhos conectados** → escaneie
5. O badge muda para **✓ WhatsApp Conectado**

Métricas aparecem em **Administrativo → Métricas da Plataforma**.

---

## 10. Manutenção rápida

| Ação | Comando |
|---|---|
| Ver logs da API | `docker compose logs -f evolution-api` |
| Reiniciar tudo | `docker compose restart` |
| Atualizar Evolution | `docker compose pull && docker compose up -d` |
| Backup do banco | `docker exec evolution_postgres pg_dump -U elite_user evolution_metadata > backup_$(date +%F).sql` |
| Espaço em disco | `docker system df` |

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| Caddy não emite certificado | DNS ainda não propagou OU Cloudflare em modo proxy (nuvem laranja) | Aguarde 10 min; deixe a nuvem **cinza** |
| `502 Bad Gateway` | Container `evolution-api` caiu | `docker compose logs evolution-api` |
| QR não aparece no simulador | Secret `EVOLUTION_API_URL` errado ou sem `https://` | Confira nos secrets do Lovable |
| `401 Unauthorized` nas chamadas | Chave do `docker-compose.yml` ≠ secret `EVOLUTION_API_KEY` | Tem que ser **exatamente** a mesma |
| WhatsApp desconecta sozinho após 1h | Normal no primeiro pareamento — reconecte | Se persistir, atualize a imagem (passo 10) |

---

## Custos de referência (operação)

- VPS 2 vCPU / 2 GB (Hetzner CX22, Contabo VPS S, DigitalOcean Basic): **R$ 25 a R$ 45/mês**
- Domínio `.com.br`: **R$ 40/ano**
- Caddy + Let's Encrypt: **grátis**
- Evolution API (open source): **grátis**

Capacidade aproximada: **50 a 100 corretores conectados simultaneamente** nessa configuração.

---

Quando estiver no ar, me avise com a URL pública + chave e eu rodo um teste end-to-end (criar instância, listar status, enviar mensagem de teste) antes de liberar para os corretores.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Sparkles, ArrowLeft, Link2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdManagerForm from "@/components/marketing/AdManagerForm";
import LuizaEliteMarketing from "@/components/marketing/LuizaEliteMarketing";
import MarketingConnections from "@/components/marketing/MarketingConnections";

const MarketingIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="admanager" className="w-full">
        <div className="elite-gradient border-b-2 border-gold/30 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 text-gold/60 hover:text-gold transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <TabsList className="bg-primary/50 border border-gold/20">
              <TabsTrigger value="admanager" className="gap-2 text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Megaphone className="w-4 h-4" /> IA SOCIAL AD MANAGE
              </TabsTrigger>
              <TabsTrigger value="luiza" className="gap-2 text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Sparkles className="w-4 h-4" /> Luiza Elite - Agente de Marketing
              </TabsTrigger>
              <TabsTrigger value="conexoes" className="gap-2 text-xs data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                <Link2 className="w-4 h-4" /> Conexões
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="admanager" className="m-0">
          <AdManagerForm />
        </TabsContent>
        <TabsContent value="luiza" className="m-0">
          <LuizaEliteMarketing />
        </TabsContent>
        <TabsContent value="conexoes" className="m-0">
          <MarketingConnections />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingIndex;

import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import TesseractLayout from "@/components/TesseractLayout";
import Mirror from "@/pages/Mirror";
import GraphView from "@/pages/GraphView";
import OntologyView from "@/pages/OntologyView";
import InferenceView from "@/pages/InferenceView";
import Subscription from "@/pages/Subscription";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  const [activeSection, setActiveSection] = useState<"mirror" | "graph" | "ontology" | "inference">("mirror");

  const renderContent = () => {
    switch (activeSection) {
      case "mirror":
        return <Mirror />;
      case "graph":
        return <GraphView />;
      case "ontology":
        return <OntologyView />;
      case "inference":
        return <InferenceView />;
      default:
        return <Mirror />;
    }
  };

  return (
    <Switch>
      <Route path={"/"}>
        <TesseractLayout activeSection={activeSection} onSectionChange={setActiveSection}>
          {renderContent()}
        </TesseractLayout>
      </Route>
      <Route path={"/mirror"}>
        <TesseractLayout activeSection="mirror" onSectionChange={setActiveSection}>
          <Mirror />
        </TesseractLayout>
      </Route>
      <Route path={"/graph"}>
        <TesseractLayout activeSection="graph" onSectionChange={setActiveSection}>
          <GraphView />
        </TesseractLayout>
      </Route>
      <Route path={"/ontology"}>
        <TesseractLayout activeSection="ontology" onSectionChange={setActiveSection}>
          <OntologyView />
        </TesseractLayout>
      </Route>
      <Route path={"/inference"}>
        <TesseractLayout activeSection="inference" onSectionChange={setActiveSection}>
          <InferenceView />
        </TesseractLayout>
      </Route>
      <Route path={"/subscription"} component={Subscription} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

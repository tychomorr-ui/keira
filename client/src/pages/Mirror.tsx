import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GeometryScores {
  unityScore: number;
  opportunityScore: number;
  resistanceLevel: number;
  compositeHarmony: number;
  phoenixNeeded: boolean;
}

export default function Mirror() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [geometry, setGeometry] = useState<GeometryScores | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);

  const reflectMutation = trpc.mirror.reflect.useMutation();
  const historyQuery = trpc.mirror.getHistory.useQuery({ limit: 10 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (input.trim().length < 10) {
      toast.error("Input must be at least 10 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await reflectMutation.mutateAsync({ input });

      if (result.success) {
        setReflection(result.reflection || "");
        setPatterns(result.patterns || []);
        setGeometry(result.geometry || null);
        setNextStep(result.nextStep || null);
        setInput("");
        toast.success("Mirror reflection complete");
      } else {
        toast.error((result as any).error || "Reflection failed");
      }
    } catch (error) {
      toast.error("Error during reflection");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tesseract Mirror</h1>
          <p className="text-slate-400">
            Submit what troubles you. Receive what is true. No distortion. No comfort. Only clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Submit for Reflection</CardTitle>
                <CardDescription>
                  A situation, thought, feeling, decision, or problem you're facing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what troubles you, what you're avoiding, what you need clarity on..."
                    className="min-h-32 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || input.trim().length < 10}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reflecting...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Submit for Reflection
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reflection Results */}
            {reflection && (
              <div className="mt-6 space-y-4">
                {/* Main Reflection */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Mirror Reflection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{reflection}</p>
                  </CardContent>
                </Card>

                {/* Detected Patterns */}
                {patterns.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Detected Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {patterns.map((pattern, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-200">
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Next Step */}
                {nextStep && (
                  <Card
                    className={`border-2 ${
                      geometry?.phoenixNeeded ? "bg-red-900 border-red-600" : "bg-slate-800 border-slate-700"
                    }`}
                  >
                    <CardHeader>
                      <CardTitle
                        className={`text-lg flex items-center gap-2 ${
                          geometry?.phoenixNeeded ? "text-red-200" : "text-white"
                        }`}
                      >
                        {geometry?.phoenixNeeded && <AlertCircle className="h-5 w-5" />}
                        Your Next Step
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className={`font-semibold ${
                          geometry?.phoenixNeeded ? "text-red-100" : "text-amber-200"
                        }`}
                      >
                        {nextStep}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Geometry Scores Sidebar */}
          <div className="space-y-4">
            {geometry && (
              <>
                {/* Composite Harmony */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Composite Harmony</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-400">
                      {geometry.compositeHarmony.toFixed(1)}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${geometry.compositeHarmony}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Unity Score */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Unity Score</CardTitle>
                    <CardDescription>Duality → Higher Unity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{geometry.unityScore.toFixed(1)}</div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${geometry.unityScore}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Opportunity Score */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Opportunity Layer</CardTitle>
                    <CardDescription>Vesica Piscis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">
                      {geometry.opportunityScore.toFixed(1)}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${geometry.opportunityScore}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Resistance Level */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Resistance Level</CardTitle>
                    <CardDescription>Lower is better</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-400">{geometry.resistanceLevel.toFixed(1)}</div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${geometry.resistanceLevel}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Phoenix Status */}
                {geometry.phoenixNeeded && (
                  <Card className="bg-red-900 border-red-600">
                    <CardHeader>
                      <CardTitle className="text-red-200 text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Phoenix Protocol Active
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-100 text-sm">
                        Death, ashes, rebirth. There is no shortcut. You must die to what you were.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Mirror History */}
            {historyQuery.data && historyQuery.data.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Recent Reflections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {historyQuery.data.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600 cursor-pointer transition-colors"
                      >
                        <div className="font-semibold text-slate-200 truncate">{item.userInput.substring(0, 40)}...</div>
                        <div className="text-slate-400 text-xs">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

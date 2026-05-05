import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GraphView() {
  const [subject, setSubject] = useState("");
  const [predicate, setPredicate] = useState("");
  const [object, setObject] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const factsQuery = trpc.kg.getFacts.useQuery({});
  const addFactMutation = trpc.kg.addFact.useMutation();
  const removeFactMutation = trpc.kg.removeFact.useMutation();

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !predicate.trim() || !object.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);

    try {
      await addFactMutation.mutateAsync({
        subject: subject.trim(),
        predicate: predicate.trim(),
        object: object.trim(),
      });

      setSubject("");
      setPredicate("");
      setObject("");
      toast.success("Fact added");
      factsQuery.refetch();
    } catch (error) {
      toast.error("Failed to add fact");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFact = async (s: string, p: string, o: string) => {
    try {
      await removeFactMutation.mutateAsync({
        subject: s,
        predicate: p,
        object: o,
      });

      toast.success("Fact removed");
      factsQuery.refetch();
    } catch (error) {
      toast.error("Failed to remove fact");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Knowledge Graph</h1>
          <p className="text-slate-400">Build and explore your semantic knowledge base</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Fact Form */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Add Fact</CardTitle>
                <CardDescription>Create a new triple (subject, predicate, object)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddFact} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300 block mb-1">Subject</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Socrates"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 block mb-1">Predicate</label>
                    <Input
                      value={predicate}
                      onChange={(e) => setPredicate(e.target.value)}
                      placeholder="e.g., is_a"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 block mb-1">Object</label>
                    <Input
                      value={object}
                      onChange={(e) => setObject(e.target.value)}
                      placeholder="e.g., Philosopher"
                      className="bg-slate-700 border-slate-600 text-white"
                      disabled={isLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fact
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Facts List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Facts ({factsQuery.data?.length || 0})</CardTitle>
                <CardDescription>All triples in your knowledge graph</CardDescription>
              </CardHeader>
              <CardContent>
                {factsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : factsQuery.data && factsQuery.data.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {factsQuery.data.map((fact) => (
                      <div
                        key={fact.id}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-200">
                            <span className="font-semibold text-blue-400">{fact.subject}</span>
                            <span className="text-slate-400"> → </span>
                            <span className="font-semibold text-emerald-400">{fact.predicate}</span>
                            <span className="text-slate-400"> → </span>
                            <span className="font-semibold text-purple-400">{fact.object}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(fact.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFact(fact.subject, fact.predicate, fact.object)}
                          className="ml-2 p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No facts yet. Add your first triple to begin.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

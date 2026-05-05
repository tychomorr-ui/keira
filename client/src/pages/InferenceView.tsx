import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function InferenceView() {
  const [transitiveEntity1, setTransitiveEntity1] = useState("");
  const [transitiveEntity2, setTransitiveEntity2] = useState("");
  const [transitiveProperty, setTransitiveProperty] = useState("");
  const [isLoadingTransitive, setIsLoadingTransitive] = useState(false);

  const [subclassEntity, setSubclassEntity] = useState("");
  const [superclassEntity, setSuperclassEntity] = useState("");
  const [isLoadingSubclass, setIsLoadingSubclass] = useState(false);

  const [transitiveResult, setTransitiveResult] = useState<boolean | null>(null);
  const [subclassResult, setSubclassResult] = useState<boolean | null>(null);

  const utils = trpc.useUtils();

  const handleCheckTransitive = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transitiveEntity1.trim() || !transitiveEntity2.trim() || !transitiveProperty.trim()) {
      toast.error("All fields are required");
      return;
    }

    setIsLoadingTransitive(true);

    try {
      // Use the tRPC client directly to fetch data
      const result = await utils.kg.checkTransitiveProperty.fetch({
        entity1: transitiveEntity1.trim(),
        property: transitiveProperty.trim(),
        entity2: transitiveEntity2.trim(),
      });

      setTransitiveResult(result.result);
      if (result.result) {
        toast.success(`Transitive relationship found: ${result.path?.join(" → ") || "direct"}`);
      } else {
        toast.info("No transitive relationship found");
      }
    } catch (error) {
      toast.error("Failed to check transitive property");
      console.error(error);
    } finally {
      setIsLoadingTransitive(false);
    }
  };

  const handleCheckSubclass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subclassEntity.trim() || !superclassEntity.trim()) {
      toast.error("Both fields are required");
      return;
    }

    setIsLoadingSubclass(true);

    try {
      // Use the tRPC client directly to fetch data
      const result = await utils.kg.checkSubclass.fetch({
        className: subclassEntity.trim(),
        parentClassName: superclassEntity.trim(),
      });

      setSubclassResult(result.result);
      if (result.result) {
        toast.success("Subclass relationship confirmed!");
      } else {
        toast.info("Not a subclass relationship");
      }
    } catch (error) {
      toast.error("Failed to check subclass relationship");
      console.error(error);
    } finally {
      setIsLoadingSubclass(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Inference Engine</h1>
          <p className="text-slate-400">Discover logical relationships and derive new knowledge</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transitive Property Check */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Check Transitive Property</CardTitle>
              <CardDescription>Verify if a relationship is transitive between two entities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCheckTransitive} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Entity 1</label>
                  <Input
                    value={transitiveEntity1}
                    onChange={(e) => setTransitiveEntity1(e.target.value)}
                    placeholder="e.g., Socrates"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoadingTransitive}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 block mb-1">Property</label>
                  <Input
                    value={transitiveProperty}
                    onChange={(e) => setTransitiveProperty(e.target.value)}
                    placeholder="e.g., is_a"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoadingTransitive}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 block mb-1">Entity 2</label>
                  <Input
                    value={transitiveEntity2}
                    onChange={(e) => setTransitiveEntity2(e.target.value)}
                    placeholder="e.g., Mortal"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoadingTransitive}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoadingTransitive}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoadingTransitive ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Transitive
                    </>
                  )}
                </Button>
              </form>

              {transitiveResult !== null && (
                <div
                  className={`p-4 rounded flex items-center gap-2 ${
                    transitiveResult
                      ? "bg-emerald-900/30 border border-emerald-600"
                      : "bg-red-900/30 border border-red-600"
                  }`}
                >
                  {transitiveResult ? (
                    <>
                      <CheckCircle className="text-emerald-400" size={20} />
                      <span className="text-emerald-200">Transitive relationship confirmed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-400" size={20} />
                      <span className="text-red-200">No transitive relationship found</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subclass Relationship Check */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Check Subclass Relationship</CardTitle>
              <CardDescription>Verify if one class is a subclass of another</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCheckSubclass} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Subclass</label>
                  <Input
                    value={subclassEntity}
                    onChange={(e) => setSubclassEntity(e.target.value)}
                    placeholder="e.g., Dog"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoadingSubclass}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 block mb-1">Superclass</label>
                  <Input
                    value={superclassEntity}
                    onChange={(e) => setSuperclassEntity(e.target.value)}
                    placeholder="e.g., Animal"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoadingSubclass}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoadingSubclass}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoadingSubclass ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Subclass
                    </>
                  )}
                </Button>
              </form>

              {subclassResult !== null && (
                <div
                  className={`p-4 rounded flex items-center gap-2 ${
                    subclassResult
                      ? "bg-emerald-900/30 border border-emerald-600"
                      : "bg-red-900/30 border border-red-600"
                  }`}
                >
                  {subclassResult ? (
                    <>
                      <CheckCircle className="text-emerald-400" size={20} />
                      <span className="text-emerald-200">Subclass relationship confirmed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-400" size={20} />
                      <span className="text-red-200">Not a subclass relationship</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Information */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">How Inference Works</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <p>
              <strong className="text-white">Transitive Properties:</strong> If A relates to B through property P, and B
              relates to C through property P, then A relates to C through P.
            </p>
            <p>
              <strong className="text-white">Subclass Relationships:</strong> If class A is a subclass of B, and B is a
              subclass of C, then A is a subclass of C (transitive inheritance).
            </p>
            <p>
              <strong className="text-white">Example:</strong> If Socrates is_a Philosopher, and Philosopher is_a
              Mortal, then Socrates is_a Mortal (by transitivity).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

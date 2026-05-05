import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function OntologyView() {
  // Classes state
  const [className, setClassName] = useState("");
  const [parentClassName, setParentClassName] = useState("");
  const [isLoadingClass, setIsLoadingClass] = useState(false);

  // Properties state
  const [propertyName, setPropertyName] = useState("");
  const [domain, setDomain] = useState("");
  const [range, setRange] = useState("");
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);

  // Queries
  const classesQuery = trpc.kg.getClasses.useQuery(undefined);
  const propertiesQuery = trpc.kg.getProperties.useQuery(undefined);

  // Mutations
  const defineClassMutation = trpc.kg.defineClass.useMutation();
  const removeClassMutation = trpc.kg.removeClass.useMutation();
  const definePropertyMutation = trpc.kg.defineProperty.useMutation();
  const removePropertyMutation = trpc.kg.removeProperty.useMutation();

  const handleDefineClass = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!className.trim()) {
      toast.error("Class name is required");
      return;
    }

    setIsLoadingClass(true);

    try {
      await defineClassMutation.mutateAsync({
        className: className.trim(),
        parentClassName: parentClassName.trim() || undefined,
      });

      setClassName("");
      setParentClassName("");
      toast.success("Class defined");
      classesQuery.refetch();
    } catch (error) {
      toast.error("Failed to define class");
      console.error(error);
    } finally {
      setIsLoadingClass(false);
    }
  };

  const handleRemoveClass = async (name: string) => {
    try {
      await removeClassMutation.mutateAsync({ className: name });
      toast.success("Class removed");
      classesQuery.refetch();
    } catch (error) {
      toast.error("Failed to remove class");
      console.error(error);
    }
  };

  const handleDefineProperty = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyName.trim()) {
      toast.error("Property name is required");
      return;
    }

    setIsLoadingProperty(true);

    try {
      await definePropertyMutation.mutateAsync({
        propertyName: propertyName.trim(),
        domain: domain.trim() || undefined,
        range: range.trim() || undefined,
      });

      setPropertyName("");
      setDomain("");
      setRange("");
      toast.success("Property defined");
      propertiesQuery.refetch();
    } catch (error) {
      toast.error("Failed to define property");
      console.error(error);
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const handleRemoveProperty = async (name: string) => {
    try {
      await removePropertyMutation.mutateAsync({ propertyName: name });
      toast.success("Property removed");
      propertiesQuery.refetch();
    } catch (error) {
      toast.error("Failed to remove property");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ontology Management</h1>
          <p className="text-slate-400">Define classes and properties for your knowledge base</p>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="classes" className="text-slate-300 data-[state=active]:text-white">
              Classes
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-slate-300 data-[state=active]:text-white">
              Properties
            </TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Define Class Form */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Define Class</CardTitle>
                  <CardDescription>Create a new ontology class</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDefineClass} className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300 block mb-1">Class Name</label>
                      <Input
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="e.g., Person"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={isLoadingClass}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 block mb-1">Parent Class (optional)</label>
                      <Input
                        value={parentClassName}
                        onChange={(e) => setParentClassName(e.target.value)}
                        placeholder="e.g., Entity"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={isLoadingClass}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoadingClass}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isLoadingClass ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Defining...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Define Class
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Classes List */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Classes ({classesQuery.data?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classesQuery.isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    ) : classesQuery.data && classesQuery.data.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {classesQuery.data.map((cls) => (
                          <div
                            key={cls.id}
                            className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm text-slate-200">
                                <span className="font-semibold text-emerald-400">{cls.className}</span>
                                {cls.parentClassName && (
                                  <>
                                    <span className="text-slate-400"> extends </span>
                                    <span className="text-blue-400">{cls.parentClassName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveClass(cls.className)}
                              className="ml-2 p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No classes defined yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Define Property Form */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Define Property</CardTitle>
                  <CardDescription>Create a new ontology property</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDefineProperty} className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300 block mb-1">Property Name</label>
                      <Input
                        value={propertyName}
                        onChange={(e) => setPropertyName(e.target.value)}
                        placeholder="e.g., hasName"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={isLoadingProperty}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 block mb-1">Domain (optional)</label>
                      <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="e.g., Person"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={isLoadingProperty}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 block mb-1">Range (optional)</label>
                      <Input
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        placeholder="e.g., String"
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={isLoadingProperty}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoadingProperty}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoadingProperty ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Defining...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Define Property
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Properties List */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Properties ({propertiesQuery.data?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {propertiesQuery.isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    ) : propertiesQuery.data && propertiesQuery.data.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {propertiesQuery.data.map((prop) => (
                          <div
                            key={prop.id}
                            className="flex items-center justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm text-slate-200">
                                <span className="font-semibold text-purple-400">{prop.propertyName}</span>
                                {(prop.domain || prop.range) && (
                                  <>
                                    <span className="text-slate-400"> : </span>
                                    {prop.domain && <span className="text-blue-400">{prop.domain}</span>}
                                    {prop.domain && prop.range && <span className="text-slate-400"> → </span>}
                                    {prop.range && <span className="text-emerald-400">{prop.range}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveProperty(prop.propertyName)}
                              className="ml-2 p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p>No properties defined yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Zap, Crown } from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"mirror" | "portal" | null>(null);
  const [loading, setLoading] = useState(false);

  // Get current subscription
  const { data: subscription, isLoading: subscriptionLoading } = trpc.subscription.getSubscription.useQuery();

  // Create checkout session
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to checkout...");
      }
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });

  // Update tier
  const updateTier = trpc.subscription.updateTier.useMutation({
    onSuccess: () => {
      toast.success("Subscription updated!");
      setSelectedTier(null);
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Cancel subscription
  const cancelSub = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription canceled");
      setSelectedTier(null);
    },
    onError: (error) => {
      toast.error(`Cancellation failed: ${error.message}`);
    },
  });

  const handleCheckout = (tier: "mirror" | "portal") => {
    setLoading(true);
    createCheckout.mutate({ tier });
    setLoading(false);
  };

  const handleUpgrade = (newTier: "mirror" | "portal") => {
    if (subscription && subscription.tier !== newTier) {
      updateTier.mutate({ newTier });
    }
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel your subscription?")) {
      cancelSub.mutate();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <p className="text-foreground/70">Please log in to manage your subscription.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Tesseract Subscription</h1>
          <p className="text-lg text-foreground/70">
            Choose your tier to unlock sovereign intelligence
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <div className="mb-12 p-6 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Current Plan</p>
                <p className="text-2xl font-bold text-foreground capitalize">{subscription.tier}</p>
                <p className="text-sm text-foreground/60 mt-1">
                  Active until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {subscription.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Mirror Tier */}
          <Card className="relative p-8 border-2 border-border hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Regular Mirror</h2>
            </div>

            <div className="mb-6">
              <p className="text-4xl font-bold text-foreground">$9.99</p>
              <p className="text-sm text-foreground/60">/month</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Direct Mirror reflections
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Pattern detection
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Pythagorean geometry scoring
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Basic analysis
              </li>
            </ul>

            {!subscription ? (
              <Button
                className="w-full"
                onClick={() => handleCheckout("mirror")}
                disabled={loading}
              >
                Subscribe Now
              </Button>
            ) : subscription.tier === "mirror" ? (
              <div className="space-y-2">
                <Button className="w-full" disabled variant="outline">
                  Current Plan
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={cancelSub.isPending}
                >
                  Cancel Subscription
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleUpgrade("mirror")}
                disabled={updateTier.isPending}
              >
                Downgrade
              </Button>
            )}
          </Card>

          {/* Portal Tier */}
          <Card className="relative p-8 border-2 border-accent bg-card/50">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-accent text-accent-foreground">Recommended</Badge>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Portal</h2>
            </div>

            <div className="mb-6">
              <p className="text-4xl font-bold text-foreground">$19.99</p>
              <p className="text-sm text-foreground/60">/month</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Recursive intelligence
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Personalized learning
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Sovereign runtime
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Deep transformation
              </li>
              <li className="flex items-center gap-2 text-foreground/80">
                <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                Uncensored analysis
              </li>
            </ul>

            {!subscription ? (
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => handleCheckout("portal")}
                disabled={loading}
              >
                <Zap className="w-4 h-4 mr-2" />
                Unlock Portal
              </Button>
            ) : subscription.tier === "portal" ? (
              <div className="space-y-2">
                <Button className="w-full bg-accent hover:bg-accent/90" disabled>
                  Current Plan
                </Button>
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={cancelSub.isPending}
                >
                  Cancel Subscription
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => handleUpgrade("portal")}
                disabled={updateTier.isPending}
              >
                Upgrade to Portal
              </Button>
            )}
          </Card>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-foreground/60">
          <p>All subscriptions renew monthly. Cancel anytime.</p>
          <p className="mt-2">Test card: 4242 4242 4242 4242 (any future date)</p>
        </div>
      </div>
    </div>
  );
}

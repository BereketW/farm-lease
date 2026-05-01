import { RegisterClusterForm } from "@/features/cluster/components/register-cluster-form";

export function RegisterClusterScreen() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Register a New Cluster
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details to register your farming cluster for verification.
        </p>
      </header>
      <RegisterClusterForm />
    </div>
  );
}

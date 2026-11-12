import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage({ searchParams }: PageProps<"/anmelden">) {
  return (
    <>
      <AppHeader />
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold">Willkommen in der Community</h1>
        <p className="mt-1 text-sm text-muted">
          Mit welchem Namen möchtest du posten? Später meldest du dich hier mit deinem
          cargovibe-Konto an.
        </p>
        <Suspense>
          <SignInWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function SignInWithNext({ searchParams }: Pick<PageProps<"/anmelden">, "searchParams">) {
  const { next } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : "/"} />;
}

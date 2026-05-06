import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  Code2Icon,
  EyeIcon,
  LayoutDashboardIcon,
  MessageSquareTextIcon,
  RocketIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: MessageSquareTextIcon,
    title: "Describe the app",
    description:
      "Start from a sentence, a feature list, or a product idea and keep the conversation moving.",
  },
  {
    icon: EyeIcon,
    title: "Preview instantly",
    description:
      "Review generated screens in a live workspace before deciding what should change next.",
  },
  {
    icon: Code2Icon,
    title: "Keep the code",
    description:
      "Every project stays organized so you can inspect the files and continue from the same place.",
  },
] as const;

const workflow = [
  "Landing pages",
  "Dashboards",
  "SaaS tools",
  "Marketplaces",
  "Internal apps",
] as const;

export const SignedOutLanding = () => {
  return (
    <div className="space-y-20 pb-16 md:space-y-24 md:pb-24">
      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border bg-card/90 p-5 shadow-sm"
          >
            <div className="mb-5 flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section className="grid items-center gap-10 border-y bg-card/55 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-16">
        <div className="space-y-6 px-1">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-background px-3 py-1 text-sm font-medium text-primary">
            <SparklesIcon className="size-4" />
            AI app studio
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">
              From rough idea to working interface
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              flowAi gives new builders a calm place to shape an app, compare
              iterations, and turn vague requirements into something real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflow.map((item) => (
              <span
                key={item}
                className="rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="flowAi" width={24} height={24} />
              <span className="text-sm font-semibold">Workspace preview</span>
            </div>
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span className="size-2 rounded-full bg-chart-5" />
              <span className="size-2 rounded-full bg-chart-2" />
            </div>
          </div>
          <div className="grid min-h-[320px] gap-0 md:grid-cols-[0.85fr_1.15fr]">
            <div className="border-b p-4 md:border-b-0 md:border-r">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <MessageSquareTextIcon className="size-4 text-primary" />
                Prompt
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm leading-6 text-muted-foreground">
                Build a customer portal with onboarding, usage charts, and a
                clean billing view.
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-4/5 rounded bg-primary/25" />
                <div className="h-2 w-3/5 rounded bg-chart-2/25" />
                <div className="h-2 w-2/3 rounded bg-chart-5/30" />
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                <LayoutDashboardIcon className="size-4 text-primary" />
                Generated screen
              </div>
              <div className="grid gap-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="h-2.5 w-28 rounded bg-foreground/20" />
                      <div className="mt-2 h-2 w-20 rounded bg-muted" />
                    </div>
                    <RocketIcon className="size-5 text-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 rounded-md bg-primary/15" />
                    <div className="h-16 rounded-md bg-chart-2/15" />
                    <div className="h-16 rounded-md bg-chart-5/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 rounded-lg border bg-card" />
                  <div className="h-24 rounded-lg border bg-card" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 rounded-lg border bg-foreground p-6 text-background shadow-sm md:flex-row md:items-center md:p-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Ready to save your first workspace?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-background/70">
            Create an account to keep projects, return to previous builds, and
            continue iterating whenever the idea gets sharper.
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="shrink-0 bg-background text-foreground hover:bg-background/90"
        >
          <Link href="/sign-up">
            Sign up
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
};

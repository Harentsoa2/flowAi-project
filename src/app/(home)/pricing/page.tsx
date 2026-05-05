"use client";

import Image from "next/image";
import { dark } from "@clerk/themes";
import { PricingTable } from "@clerk/nextjs";

import { useCurrentTheme } from "@/hooks/use-current-theme";

const Page = () => {
  const currentTheme = useCurrentTheme();

  return ( 
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <section className="space-y-6 pt-20 md:pt-28 2xl:pt-36">
        <div className="flex flex-col items-center gap-3">
          <Image 
            src="/logo.svg"
            alt="flowAi"
            width={44}
            height={44}
            className="hidden md:block"
          />
          <span className="rounded-md border border-primary/25 bg-card px-3 py-1 text-sm font-semibold text-primary">
            flowAi
          </span>
        </div>
        <h1 className="text-center text-2xl font-semibold tracking-tight md:text-4xl">
          Plans
        </h1>
        <p className="text-center text-sm text-muted-foreground md:text-base">
          Choose the workspace capacity that fits your build pace.
        </p>
        <PricingTable
          appearance={{
            baseTheme: currentTheme === "dark" ? dark : undefined,
            elements: {
              pricingTableCard: "border! shadow-none! rounded-lg!",
              pricingTableCardHeader: "bg-card!",
            }
          }}
        />
      </section>
    </div>
   );
}
 
export default Page;

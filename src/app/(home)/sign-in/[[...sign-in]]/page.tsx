"use client";

import { dark } from "@clerk/themes";
import { SignIn } from "@clerk/nextjs";

import { useCurrentTheme } from "@/hooks/use-current-theme";

const Page = () => {
  const currentTheme = useCurrentTheme();

  return ( 
    <div className="mx-auto flex w-full max-w-3xl flex-col">
      <section className="space-y-6 pt-20 md:pt-28 2xl:pt-36">
        <div className="flex flex-col items-center">
          <SignIn
            appearance={{
              baseTheme: currentTheme === "dark" ? dark : undefined,
              elements: {
                cardBox: "border! shadow-sm! rounded-lg!",
                formButtonPrimary: "bg-primary! text-primary-foreground! hover:bg-primary/90!",
              },
            }}
          />
        </div>
      </section>
    </div>
   );
}
 
export default Page;

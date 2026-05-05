import Image from "next/image";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";

const Page = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <section className="space-y-7 py-20 md:py-28 2xl:py-36">
        <div className="flex items-center justify-center gap-3">
          <Image
            src="/logo.svg"
            alt="flowAi"
            width={44}
            height={44}
            className="hidden md:block"
          />
          <span className="rounded-md border border-primary/25 bg-card px-3 py-1 text-sm font-semibold text-primary">
            flowAi Studio
          </span>
        </div>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-balance md:text-5xl">
          Build with flowAi
        </h1>
        <p className="mx-auto max-w-2xl text-center text-base text-muted-foreground md:text-lg">
          Turn a product idea into a live app workspace with a conversation.
        </p>
        <div className="mx-auto w-full max-w-3xl">
          <ProjectForm />
        </div>
      </section>
      <ProjectsList />
    </div>
  );
};
 
export default Page;

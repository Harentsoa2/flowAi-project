import { Navbar } from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  return ( 
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Navbar />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-accent/35 dark:bg-accent/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 border-t bg-card/60" />
      <div className="flex flex-1 flex-col px-4 pb-6 pt-16">
        {children}
      </div>
    </main>
  );
};
 
export default Layout;

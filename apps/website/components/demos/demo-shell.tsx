"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { motion } from "framer-motion";
import { CodeBlock } from "./code-block";

interface CodeExample {
  vanilla: string;
  react: string;
}

interface DemoShellProps {
  title: string;
  description: string;
  code: CodeExample;
  gradient?: string;
  children: React.ReactNode;
}

const defaultGradient = "bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-cyan-400/20";

export function DemoShell({
  title,
  description,
  code,
  gradient = defaultGradient,
  children,
}: DemoShellProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="py-24 border-t border-zinc-800/50"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-end">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h2>
            <p className="text-lg text-zinc-400 leading-relaxed">{description}</p>
            <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <Tabs
                aria-label="Code examples"
                variant="underlined"
                defaultSelectedKey="react"
                classNames={{
                  base: "border-b border-zinc-800 w-full",
                  tabList: "bg-zinc-900 px-4",
                  tab: "text-zinc-400 data-[selected=true]:text-white",
                  cursor: "bg-rose-500",
                }}
              >
                <Tab key="vanilla" title="Vanilla">
                  <CodeBlock code={code.vanilla} />
                </Tab>
                <Tab key="react" title="React">
                  <CodeBlock code={code.react} />
                </Tab>
              </Tabs>
            </div>
          </div>

          <div
            className={`relative rounded-2xl overflow-hidden ${gradient} p-8 min-h-[320px] flex items-center`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
            <div className="relative w-full">{children}</div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

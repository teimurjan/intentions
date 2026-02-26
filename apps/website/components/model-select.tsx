"use client";

import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { IconChevronDown } from "@tabler/icons-react";
import { useProviderContext } from "@/contexts/provider-context";

type ModelKey = "qwen" | "llama";

interface ModelOption {
  key: ModelKey;
  label: string;
}

const models: ModelOption[] = [
  { key: "qwen", label: "Qwen 0.5B" },
  { key: "llama", label: "Llama 3.2 1B" },
];

export function ModelSelect() {
  const { provider, setProvider } = useProviderContext();
  const currentModel = models.find((m) => m.key === provider) ?? models[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="flat" size="sm" endContent={<IconChevronDown size={14} />}>
          {currentModel.label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Model selection"
        selectionMode="single"
        selectedKeys={new Set([provider])}
        onSelectionChange={(keys) => {
          const key = Array.from(keys)[0] as ModelKey;
          if (key) setProvider(key);
        }}
      >
        {models.map((m) => (
          <DropdownItem key={m.key}>{m.label}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

import { ReactElement } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTooltipProps {
  children: ReactElement;
  message?: string;
}

export default function MetricTooltip({
  children,
  message = "Add tooltip message",
}: MetricTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-[350px]  sm:max-w-[380px] whitespace-pre-line bg-white text-black border rounded-md px-4 py-2 mb-1 text-md font-sm font-custom shadow-md">
        <p className="text-md leading-relaxed  font-custom">{message}</p>
      </TooltipContent>
    </Tooltip>
  );
}


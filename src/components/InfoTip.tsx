import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

type Props = {
  text: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string; // applied to content
  iconClassName?: string; // applied to icon
};

// Renders a desktop Tooltip and a click-to-open Popover on mobile.
const InfoTip: React.FC<Props> = ({ text, side = 'top', align = 'center', className, iconClassName }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button aria-label="info" type="button">
            <HelpCircle className={iconClassName || 'h-4 w-4 text-gray-400'} />
          </button>
        </PopoverTrigger>
        <PopoverContent side={side} align={align} className={['max-w-xs whitespace-normal leading-snug', className].filter(Boolean).join(' ')}>
          {text}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className={iconClassName || 'h-4 w-4 text-gray-400'} />
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className={['max-w-xs whitespace-normal leading-snug', className].filter(Boolean).join(' ')}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTip;


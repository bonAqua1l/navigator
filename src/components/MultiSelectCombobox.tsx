import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export interface MultiSelectProps {
    options: Array<{ id: string; name: string }>;
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
}

export function MultiSelectCombobox({ options, selected, onChange, placeholder = "Выберите...", searchPlaceholder = "Поиск..." }: MultiSelectProps) {
    const [open, setOpen] = useState(false);

    const toggleOption = (optionId: string) => {
        const newSelected = selected.includes(optionId)
            ? selected.filter(id => id !== optionId)
            : [...selected, optionId];
        onChange(newSelected);
    };

    const getDisplayText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length === 1) {
            const item = options.find(opt => opt.id === selected[0]);
            return item?.name || placeholder;
        }
        return `Выбрано: ${selected.length}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className="truncate">{getDisplayText()}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>Ничего не найдено</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    onSelect={() => toggleOption(option.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Checkbox
                                            checked={selected.includes(option.id)}
                                            className="pointer-events-none"
                                        />
                                        <span className="flex-1">{option.name}</span>
                                        {selected.includes(option.id) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

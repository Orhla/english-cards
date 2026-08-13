"use client"

import AddArrayFieldButton from "@/components/AddArrayFieldButton"
import DeleteArrayFieldButton from "@/components/DeleteArrayFieldButton"
import { Input } from "@/components/ui/input"

export type ArrayFieldItem = {
    id: string
    value: string
}


type Props = {
  label: string
  name: string
  values: ArrayFieldItem[]
  onChange: (values: ArrayFieldItem[]) => void
  placeholder?: string
  disabled?: boolean
}

export default function ArrayFieldInput({label, name, values, onChange, placeholder, disabled}: Props) {

    const handleInputChange = (id: string, newValue: string) => {
        onChange(
            values.map((item) => (item.id === id ? { ...item, value: newValue } : item))
        );
    };

    const handleAddField = () => {
        const newItem: ArrayFieldItem = {
            id: crypto.randomUUID(),
            value: ""
        };
        onChange([...values, newItem]);
    };

    const handleDeleteField = (idToRemove: string) => {
        if (values.length > 1) {
            onChange(values.filter((item) => item.id !== idToRemove));
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-foreground">{label}</div>
                <AddArrayFieldButton onClick={handleAddField} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-2">
                {values.map((item) => (
                    <div key={item.id} className="flex gap-2 items-center">
                        <Input
                            name={name}
                            value={item.value}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                            placeholder={placeholder}
                            disabled={disabled} />
                        <DeleteArrayFieldButton disabled={disabled || values.length <= 1}
                                                onClick={() => handleDeleteField(item.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
}
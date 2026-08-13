"use client"

import { useFormContext } from "react-hook-form"
import AddArrayFieldButton from "@/components/AddArrayFieldButton"
import DeleteArrayFieldButton from "@/components/DeleteArrayFieldButton"
import { Input } from "@/components/ui/input"

type Props = {
  label: string
  name: string
  fields: { id: string }[]
  onAdd: () => void
  onRemove: (index: number) => void
  placeholder?: string
  disabled?: boolean
}

export default function ArrayFieldInput({ label, name, fields, onAdd, onRemove, placeholder, disabled }: Props) {
    const { register } = useFormContext()

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-foreground">{label}</div>
                <AddArrayFieldButton onClick={onAdd} disabled={disabled} />
            </div>
            <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <Input
                            {...register(`${name}.${index}.value`)}
                            placeholder={placeholder}
                            disabled={disabled}
                        />
                        <DeleteArrayFieldButton
                            disabled={disabled || fields.length <= 1}
                            onClick={() => onRemove(index)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

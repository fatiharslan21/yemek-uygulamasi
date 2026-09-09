type OptionPillsProps<T extends string> = {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}

export function OptionPills<T extends string>({ options, value, onChange }: OptionPillsProps<T>) {
  return (
    <div className="option-pills">
      {options.map((option) => (
        <button
          key={option}
          className={`option-pill ${value === option ? 'is-active' : ''}`}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}

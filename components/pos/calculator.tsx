"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator as CalculatorIcon } from "lucide-react"

interface CalculatorProps {
  onResult?: (result: number) => void
}

export function Calculator({ onResult }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
    }
  }

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(`${parseFloat(newValue.toFixed(7))}`)
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue
      case "-":
        return firstValue - secondValue
      case "×":
        return firstValue * secondValue
      case "÷":
        return firstValue / secondValue
      default:
        return secondValue
    }
  }

  const performCalculation = () => {
    const inputValue = parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      const result = parseFloat(newValue.toFixed(7))

      setDisplay(`${result}`)
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)

      // Call onResult callback if provided
      if (onResult) {
        onResult(result)
      }
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalculatorIcon className="h-5 w-5" />
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-right text-2xl font-mono font-bold min-h-[2.5rem] overflow-hidden">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button
            variant="outline"
            onClick={clear}
            className="h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            C
          </Button>
          <Button
            variant="outline"
            onClick={() => inputOperation("÷")}
            className="h-12"
          >
            ÷
          </Button>
          <Button
            variant="outline"
            onClick={() => inputOperation("×")}
            className="h-12"
          >
            ×
          </Button>
          <Button
            variant="outline"
            onClick={() => inputOperation("-")}
            className="h-12"
          >
            -
          </Button>

          {/* Row 2 */}
          <Button
            variant="outline"
            onClick={() => inputNumber("7")}
            className="h-12"
          >
            7
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("8")}
            className="h-12"
          >
            8
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("9")}
            className="h-12"
          >
            9
          </Button>
          <Button
            variant="outline"
            onClick={() => inputOperation("+")}
            className="h-12 row-span-2"
          >
            +
          </Button>

          {/* Row 3 */}
          <Button
            variant="outline"
            onClick={() => inputNumber("4")}
            className="h-12"
          >
            4
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("5")}
            className="h-12"
          >
            5
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("6")}
            className="h-12"
          >
            6
          </Button>

          {/* Row 4 */}
          <Button
            variant="outline"
            onClick={() => inputNumber("1")}
            className="h-12"
          >
            1
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("2")}
            className="h-12"
          >
            2
          </Button>
          <Button
            variant="outline"
            onClick={() => inputNumber("3")}
            className="h-12"
          >
            3
          </Button>
          <Button
            variant="outline"
            onClick={performCalculation}
            className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            =
          </Button>

          {/* Row 5 */}
          <Button
            variant="outline"
            onClick={() => inputNumber("0")}
            className="h-12 col-span-2"
          >
            0
          </Button>
          <Button
            variant="outline"
            onClick={inputDecimal}
            className="h-12"
          >
            .
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
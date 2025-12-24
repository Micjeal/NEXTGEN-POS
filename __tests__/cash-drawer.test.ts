/**
 * Cash Drawer Management Validation Tests
 * Simple validation functions for edge cases and business logic
 */

// Validation functions for cash drawer operations
export class CashDrawerValidator {
  static validateOpeningBalance(balance: number): boolean {
    return balance >= 0
  }

  static validateTransactionAmount(amount: number): boolean {
    return Math.abs(amount) > 0
  }

  static calculateExpectedBalance(openingBalance: number, transactions: Array<{amount: number}>): number {
    return transactions.reduce((sum, t) => sum + t.amount, openingBalance)
  }

  static detectDiscrepancy(expectedBalance: number, actualBalance: number): number {
    return actualBalance - expectedBalance
  }

  static validateTransactionFields(transaction: {
    drawer_id?: string
    transaction_type?: string
    amount?: number
    description?: string
  }): boolean {
    return !!(
      transaction.drawer_id &&
      transaction.transaction_type &&
      transaction.amount !== undefined &&
      transaction.description &&
      transaction.amount !== 0
    )
  }

  static validateStatusTransition(from: string | null, to: string): boolean {
    const validTransitions = [
      { from: null, to: 'open' },
      { from: 'open', to: 'closed' },
      { from: 'closed', to: 'reconciled' }
    ]

    return validTransitions.some(t => t.from === from && t.to === to)
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
}

// Test cases
console.log('Running Cash Drawer Validation Tests...')

// Test opening balance validation
const invalidBalances = [-100, -1, -0.01]
const validBalances = [0, 0.01, 100, 1000]

console.log('Testing opening balance validation:')
invalidBalances.forEach(balance => {
  const isValid = CashDrawerValidator.validateOpeningBalance(balance)
  console.log(`Balance ${balance}: ${isValid ? 'VALID' : 'INVALID'} (expected: INVALID)`)
})

validBalances.forEach(balance => {
  const isValid = CashDrawerValidator.validateOpeningBalance(balance)
  console.log(`Balance ${balance}: ${isValid ? 'VALID' : 'INVALID'} (expected: VALID)`)
})

// Test transaction amount validation
const invalidAmounts = [0, 0.00, -0.00]
const validAmounts = [0.01, 1, -1, -0.01]

console.log('\nTesting transaction amount validation:')
invalidAmounts.forEach(amount => {
  const isValid = CashDrawerValidator.validateTransactionAmount(amount)
  console.log(`Amount ${amount}: ${isValid ? 'VALID' : 'INVALID'} (expected: INVALID)`)
})

validAmounts.forEach(amount => {
  const isValid = CashDrawerValidator.validateTransactionAmount(amount)
  console.log(`Amount ${amount}: ${isValid ? 'VALID' : 'INVALID'} (expected: VALID)`)
})

// Test balance calculations
console.log('\nTesting balance calculations:')
const openingBalance = 100
const transactions = [
  { amount: 50 },   // cash in
  { amount: -20 },  // cash out
  { amount: 10 },   // cash in
  { amount: -5 }    // cash out
]

const expectedBalance = CashDrawerValidator.calculateExpectedBalance(openingBalance, transactions)
console.log(`Expected balance: ${expectedBalance} (expected: 135)`)

// Test discrepancy detection
const actualBalance = 145
const discrepancy = CashDrawerValidator.detectDiscrepancy(expectedBalance, actualBalance)
console.log(`Discrepancy: ${discrepancy} (expected: -10)`)

// Test transaction field validation
console.log('\nTesting transaction field validation:')
const validTransaction = {
  drawer_id: 'drawer-123',
  transaction_type: 'cash_in',
  amount: 50,
  description: 'Test transaction'
}

const invalidTransactions = [
  { ...validTransaction, drawer_id: undefined },
  { ...validTransaction, transaction_type: undefined },
  { ...validTransaction, amount: undefined },
  { ...validTransaction, description: undefined },
  { ...validTransaction, amount: 0 }
]

console.log(`Valid transaction: ${CashDrawerValidator.validateTransactionFields(validTransaction) ? 'VALID' : 'INVALID'}`)

invalidTransactions.forEach((invalid, index) => {
  const isValid = CashDrawerValidator.validateTransactionFields(invalid)
  console.log(`Invalid transaction ${index + 1}: ${isValid ? 'VALID' : 'INVALID'} (expected: INVALID)`)
})

// Test status transitions
console.log('\nTesting status transitions:')
const validTransitions = [
  { from: null, to: 'open' },
  { from: 'open', to: 'closed' },
  { from: 'closed', to: 'reconciled' }
]

const invalidTransitions = [
  { from: 'open', to: 'open' },
  { from: 'closed', to: 'open' },
  { from: 'reconciled', to: 'open' },
  { from: null, to: 'closed' }
]

validTransitions.forEach(({ from, to }) => {
  const isValid = CashDrawerValidator.validateStatusTransition(from, to)
  console.log(`Transition ${from} -> ${to}: ${isValid ? 'VALID' : 'INVALID'} (expected: VALID)`)
})

invalidTransitions.forEach(({ from, to }) => {
  const isValid = CashDrawerValidator.validateStatusTransition(from, to)
  console.log(`Transition ${from} -> ${to}: ${isValid ? 'VALID' : 'INVALID'} (expected: INVALID)`)
})

// Test currency formatting
console.log('\nTesting currency formatting:')
const testAmounts = [123.45, 0, -50.25]
testAmounts.forEach(amount => {
  const formatted = CashDrawerValidator.formatCurrency(amount)
  console.log(`Amount ${amount} formatted: ${formatted}`)
})

console.log('\nAll validation tests completed!')
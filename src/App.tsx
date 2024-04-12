import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isClick, setClick] = useState(false)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [emp, setEmp] = useState(false)

  useEffect(() => {
    if (paginatedTransactions) {
      if (isClick) {
        setAllTransactions((prevTransactions) => [...prevTransactions, ...paginatedTransactions.data])
      } else {
        setAllTransactions(paginatedTransactions.data)
      }
    } else if (transactionsByEmployee) {
      if (emp)
        setAllTransactions(transactionsByEmployee)
      else
        setAllTransactions((prevTransactions) => [...prevTransactions, ...transactionsByEmployee])
    }
  }, [paginatedTransactions, transactionsByEmployee])

  const handleViewMore = () => {
    setClick(true)
    if (!emp)
      loadAllTransactions()
  }
  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    paginatedTransactionsUtils.invalidateData()
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  const handleSelectChange = async (newValue: Employee | null) => {
    setClick(false)
    if (newValue === null) {
      setEmp(false)
      return
    } else if (newValue && newValue.id === "") {
      setEmp(false)
      await loadAllTransactions()
    } else {
      setEmp(true)
      await loadTransactionsByEmployee(newValue.id)
    }
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleSelectChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={allTransactions} />

          {allTransactions && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={handleViewMore}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}

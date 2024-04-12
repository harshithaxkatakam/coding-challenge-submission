import { Fragment, useCallback, useEffect, useState } from "react"
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
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isClick, setClick] = useState(false)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [emp, setEmp] = useState("")

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
  }, [emp, isClick, paginatedTransactions, transactionsByEmployee])

  const handleViewMore = async () => {
    setClick(true)
    if (emp !== "")
      await loadTransactionsByEmployee(emp)
    else
      await loadAllTransactions()
  }
  const loadAllTransactions = useCallback(async () => {
    paginatedTransactionsUtils.invalidateData()
    transactionsByEmployeeUtils.invalidateData()
    await paginatedTransactionsUtils.fetchAll()
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const loadAllEmployees = useCallback(async () => {
    await employeeUtils.fetchAll()
    setIsLoadingEmployees(false)
  }, [employeeUtils])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      setIsLoadingEmployees(true)
      loadAllEmployees()
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllEmployees, loadAllTransactions])

  const handleSelectChange = async (newValue: Employee | null) => {
    setClick(false)
    if (newValue === null) {
      setEmp("")
      return
    } else if (newValue && newValue.id === "") {
      setEmp("")
      await loadAllTransactions()
    } else {
      setEmp(newValue.id)
      await loadTransactionsByEmployee(newValue.id)
    }
  }

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoadingEmployees}
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

          {allTransactions && emp === "" && (paginatedTransactions ? (paginatedTransactions.data.length == 5 ? true : false) : true) && (
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

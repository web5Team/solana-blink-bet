import { BetTable } from './components/bet-table'

export default function BetPage() {
  return (
    <div className="col">
      <h1 className="font-bold text-2xl my-2">
        Bet 管理
      </h1>

      {/* data table */}
      <div>
        <BetTable />
      </div>
    </div>
  )
}

import { type Table, flexRender } from '@tanstack/react-table'
import { TableHead, TableHeader, TableRow } from '../../ui/table'

export function FlatTableHeader({
  table,
}: {
  table: Table<any>
}) {
  return (
    <TableHeader>
      <TableRow>
        {table.getFlatHeaders().map(header => (
          <TableHead
            key={header.id}
            style={{ width: `${header.getSize()}px` }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

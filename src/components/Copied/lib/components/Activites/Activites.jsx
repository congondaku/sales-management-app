import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.jsx";
import {
  fetchRealtimeStats,
  fetchMarketInsights,
  fetchMigrationPatterns
} from "../../../slices/ndaku/ndakuSlice";

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

export function Activites() {

  const dispatch = useDispatch()

  const {
    realtimeStats,
    marketInsights,
    migrationPatterns,
    loading,
    error,
    lastUpdated
  } = useSelector((state) => state.ndaku)

  const [topCountries, setTopCountries] = useState([])

  useEffect(() => {
  if (marketInsights) {
    setTopCountries(marketInsights.worldwide.topCountries)
    console.log("Test Acti", marketInsights.worldwide.topCountries);
  }
}, [marketInsights]);

console.log('setTop', topCountries);

  

  useEffect(() =>{
    dispatch(fetchRealtimeStats())
    dispatch(fetchMarketInsights(30))
    dispatch(fetchMigrationPatterns(30))

    const marketInterval = setInterval(() => {
      dispatch(fetchMarketInsights(30));
      dispatch(fetchMigrationPatterns(30));
    }, 900000)

    return () => {
      clearInterval(marketInterval)
    }
  }, [dispatch])


  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          {/* <TableHead className="w-[100px]">Pays</TableHead> */}
          <TableHead>Pays</TableHead>
          <TableHead>Nombres de recherches</TableHead>
          <TableHead>Nombres des fois des utilisateurs sont connecter</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topCountries.map((countries) => (
          <TableRow >
            <TableCell className="font-medium">{countries._id}</TableCell>
            <TableCell>{countries.searches}</TableCell>
            <TableCell>{countries.uniqueUsersCount}</TableCell>
            <TableCell className="text-right"> Test</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

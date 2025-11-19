import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  created_at: string;
  marketplace_item_id: string;
  buyer_id: string;
  seller_id: string;
  transaction_hash: string;
  amount: number;
  token_symbol: string;
  network: string;
  status: string;
  marketplace_items?: {
    title: string;
  };
}

const TransactionHistory = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("crypto_transactions")
        .select(`
          *,
          marketplace_items(title)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionType = (transaction: Transaction) => {
    return transaction.buyer_id === user?.id ? "Mua" : "Bán";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      confirmed: "default",
      pending: "secondary",
      failed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "confirmed" ? "Đã xác nhận" : status === "pending" ? "Đang xử lý" : "Thất bại"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar user={user} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-6 mb-16 md:mb-0">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Lịch sử giao dịch Crypto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTransactionType(transaction) === "Mua" ? "default" : "secondary"}>
                              {getTransactionType(transaction)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span 
                              className="hover:underline cursor-pointer text-primary"
                              onClick={() => navigate(`/marketplace/${transaction.marketplace_item_id}`)}
                            >
                              {transaction.marketplace_items?.title || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {transaction.amount} {transaction.token_symbol}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`https://bscscan.com/tx/${transaction.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline text-sm"
                            >
                              {transaction.transaction_hash.slice(0, 8)}...{transaction.transaction_hash.slice(-6)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        <RightSidebar />
      </div>
      <MobileNav user={user} />
    </div>
  );
};

export default TransactionHistory;

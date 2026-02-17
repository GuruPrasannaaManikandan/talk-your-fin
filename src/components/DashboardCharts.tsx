import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(160, 84%, 39%)', 'hsl(200, 70%, 50%)', 'hsl(280, 60%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(160, 60%, 55%)', 'hsl(220, 60%, 50%)'];

interface DashboardChartsProps {
  dailySpending: { date: string; amount: number }[];
  monthlySpending: { month: string; amount: number }[];
  categoryBreakdown: Record<string, number>;
}

export function DashboardCharts({ dailySpending, monthlySpending, categoryBreakdown }: DashboardChartsProps) {
  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailySpending}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 52%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 52%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }}
              />
              <Line type="monotone" dataKey="amount" stroke="hsl(160, 84%, 39%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlySpending}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 52%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 52%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }}
              />
              <Bar dataKey="amount" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(220, 18%, 7%)', border: '1px solid hsl(220, 14%, 16%)', borderRadius: '8px', color: 'hsl(210, 20%, 92%)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No expense data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

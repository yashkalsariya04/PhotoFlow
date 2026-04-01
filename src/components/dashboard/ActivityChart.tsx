
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityData {
  name: string;
  photos: number;
  views: number;
}

interface ActivityChartProps {
  data?: ActivityData[];
}

const defaultData = [
  { name: "Jan", photos: 0, views: 0 },
  { name: "Feb", photos: 0, views: 10 },
  { name: "Mar", photos: 0, views: 0 },
  { name: "Apr", photos: 0, views: 0 },
  { name: "May", photos: 0, views: 0 },
  { name: "Jun", photos: 0, views: 0 },
  { name: "Jul", photos: 0, views: 0 },
];

export function ActivityChart({ data = defaultData }: ActivityChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="photos"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorPhotos)"
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

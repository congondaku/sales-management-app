import { motion } from "framer-motion";

export const Last24 = ({ data, title = "Last 24 Hours" }) => {
  const chartData = data && data.length > 0 ? data : [
    { label: "No data", value: 0, color: "bg-slate-600" }
  ];

  return (
    <section className="bg-slate-900 rounded-lg px-4 py-8 mb-8">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2 md:grid-cols-[1fr_400px] md:gap-12">
        <Legend data={chartData} title={title} />
        <Bars data={chartData} />
      </div>
    </section>
  );
};

const Legend = ({ data, title }) => {
  const totalValue = data.reduce((acc, item) => acc + item.value, 0);
  return (
    <div className="col-span-1 py-12">
      <h3 className="mb-6 text-3xl font-semibold text-slate-50">{title}</h3>
      <div className="mb-6 space-y-2">
        {data.map((item, index) => {
          const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
          return (
            <div key={index} className={`w-full rounded-md ${item.color} p-3 text-white`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.label}</span>
                <div className="text-right">
                  <div className="font-semibold">{item.value.toLocaleString()}</div>
                  <div className="text-xs opacity-90">{percentage}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="italic text-slate-400">Total: {totalValue.toLocaleString()}</span>
      </div>
    </div>
  );
};

const Bars = ({ data }) => {
  const totalValue = data.reduce((acc, item) => acc + item.value, 0);
  const maxValue = Math.max(...data.map(item => item.value), 1);
  return (
    <div className="col-span-1 grid min-h-[200px] gap-2" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
      {data.map((item, index) => {
        const height = ((item.value / maxValue) * 100).toFixed(2);
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0;
        return (
          <div key={index} className="col-span-1">
            <div className="relative flex h-full w-full items-end overflow-hidden rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800">
              <motion.span
                initial={{ height: "0%" }}
                animate={{ height: `${height}%` }}
                className={`relative z-0 w-full ${item.color}`}
                transition={{ type: "spring", duration: 0.8, delay: index * 0.1 }}
              />
              <span className="absolute bottom-0 left-[50%] mt-2 inline-block w-full -translate-x-[50%] p-2 text-center text-sm text-slate-50">
                <b className="block truncate px-1">{item.label}</b>
                <span className="block text-xs text-slate-200 mt-1">{item.value.toLocaleString()}</span>
                <span className="block text-xs text-slate-300 opacity-75">{percentage}%</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

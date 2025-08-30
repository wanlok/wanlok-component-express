import { Request, Response } from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { ChartConfiguration } from "chart.js";

const getChartConfiguration = (values: number[]) => {
  return {
    type: "bar",
    data: {
      labels: ["Red", "Blue", "Yellow"],
      datasets: [
        {
          label: "Votes",
          data: values,
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Simple Bar Chart"
        }
      }
    }
  } as ChartConfiguration;
};

export const barChart1 = async (req: Request, res: Response) => {
  const values = req.body.values as number[];
  const canvas = new ChartJSNodeCanvas({ width: 800, height: 600 });
  const image = await canvas.renderToBuffer(getChartConfiguration(values));
  res.set("Content-Type", "image/png");
  res.send(image);
};

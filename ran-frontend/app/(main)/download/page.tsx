"use client";

import DownloadCard from "@/components/downloadcard";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePublicConfig } from "@/context/PublicConfigContext";

const DownloadPage = () => {
  const { config } = usePublicConfig();
  const rows = config?.systemRequirements?.rows ?? [];

  return (
    <>
      <div className="container mx-auto space-y-4">
        <DownloadCard />
        <Card>
          <CardHeader>
            <CardTitle>System Requirements</CardTitle>
            <CardDescription>
              Minimum and recommended specifications to run the game smoothly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Minimum Requirement</TableHead>
                  <TableHead>Recommended Requirement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.component}</TableCell>
                    {row.rec ? (
                      <>
                        <TableCell>{row.min}</TableCell>
                        <TableCell>{row.rec}</TableCell>
                      </>
                    ) : (
                      <TableCell colSpan={2} className="text-center align-middle">
                        {row.min}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DownloadPage;

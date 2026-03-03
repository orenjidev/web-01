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

const DownloadPage = () => {
  return (
    <>
      <div className="container mx-auto space-y-4">
        {/* <div>
          <h1 className="text-3xl font-bold uppercase">Download</h1>
          <p className="text-muted-foreground">
            Download the Game. Join the action!
          </p>
        </div> */}
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
              {/* HEADER */}
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Minimum Requirement</TableHead>
                  <TableHead>Recommended Requirement</TableHead>
                </TableRow>
              </TableHeader>

              {/* BODY */}
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Operating System
                  </TableCell>
                  <TableCell>Windows 7/10</TableCell>
                  <TableCell>Windows 11</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">CPU</TableCell>
                  <TableCell>
                    Intel Pentium 3 1.2GHz or AMD Athlon 1500
                  </TableCell>
                  <TableCell>Intel Pentium 4 2.4GHz, or higher</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">MEMORY</TableCell>
                  <TableCell>4GB RAM</TableCell>
                  <TableCell>16GB RAM</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">GRAPHICS CARD</TableCell>
                  <TableCell>NVIDIA 1050TI/RX570</TableCell>
                  <TableCell>RTX 30 SERIES / RX6000 SERIES</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">HARD DRIVE</TableCell>
                  {/* merge 2 cells into one */}
                  <TableCell colSpan={2} className="text-center align-middle">
                    6GB of available hard drive space
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">
                    CONNECTION SPEED
                  </TableCell>
                  <TableCell>500KBPS</TableCell>
                  <TableCell>100MBPS</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DownloadPage;

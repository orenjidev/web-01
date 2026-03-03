import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";

interface RankingCardProps {
  rank: number;
  avatarSrc?: string;
  fallback?: string;
  playerName: string;
  level: string;
  kills: number;
  deaths: number;
  money: number;
  school: number;
}

const getSchool = (code: number): string =>
  ["Sacred Gate", "Mystic Peak", "Phoenix"][code] || "Unknown";

const RankingCard: React.FC<RankingCardProps> = ({
  rank,
  avatarSrc,
  fallback = "??",
  playerName,
  level,
  kills,
  deaths,
  money,
  school,
}) => {
  return (
    <>
      <div className="flex items-center gap-3 px-1 py-2 hover:bg-muted/40 transition-colors">
        {/* Rank */}
        <div className=" text-center text-sm font-semibold text-muted-foreground">
          #{rank}
        </div>

        {/* Avatar */}
        <Avatar className="w-8 h-8">
          {avatarSrc && <AvatarImage src={avatarSrc} />}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex justify-between items-center flex-1 min-w-0">
          {/* Player Info */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{playerName}</span>
            <span className="text-xs text-muted-foreground">
              Level: {level}
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-col items-end text-xs text-muted-foreground whitespace-nowrap">
            <span>
              K {kills} / D {deaths}
            </span>
            {/* <span className="font-medium text-foreground text-xs">
              ${money.toLocaleString()}
            </span> */}
            <span>{getSchool(school)}</span>
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
};

export default RankingCard;

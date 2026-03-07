"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Brain,
} from "lucide-react";
import {
  uploadAndBuildSkills,
  uploadSkillStrings,
  triggerBuildSkills,
  getSkillsPreview,
  getSkillDetail,
  type SkillPreviewEntry,
  type SkillDetailResult,
} from "@/lib/data/admin.buildSkills.data";

function SkillDetailModal({
  open,
  onClose,
  skillId,
}: {
  open: boolean;
  onClose: () => void;
  skillId: string | null;
}) {
  const [data, setData] = useState<SkillDetailResult["skill"] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !skillId) return;
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setData(null);
        return getSkillDetail(skillId);
      })
      .then((res) => setData(res.skill))
      .catch(() => toast.error("Failed to load skill details."))
      .finally(() => setLoading(false));
  }, [open, skillId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <>
                <span className="font-mono text-xs text-muted-foreground">
                  [{data?.skillId}]
                </span>
                {data?.name || "Unknown Skill"}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-3 py-1 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground text-xs block">Main ID</span>
                <span className="font-mono">{data.mainId}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Sub ID</span>
                <span className="font-mono">{data.subId}</span>
              </div>
              {data.maxLevel !== undefined && (
                <div>
                  <span className="text-muted-foreground text-xs block">Max Level</span>
                  <span>{data.maxLevel}</span>
                </div>
              )}
              {data.grade !== null && (
                <div>
                  <span className="text-muted-foreground text-xs block">Grade</span>
                  <Badge variant="secondary">{data.grade}</Badge>
                </div>
              )}
              {data.classInfo && (
                <div>
                  <span className="text-muted-foreground text-xs block">Class</span>
                  <Badge
                    variant="secondary"
                    title={`Mask: ${data.classInfo.glccValue} (${data.classInfo.glccHex})\n${data.classInfo.glccBits.join(" | ")}`}
                  >
                    {data.classInfo.group}
                  </Badge>
                </div>
              )}
              {data.impact?.target && (
                <div>
                  <span className="text-muted-foreground text-xs block">Impact Target</span>
                  <Badge variant="outline">{data.impact.target.label}</Badge>
                </div>
              )}
              {data.impact?.realm && (
                <div>
                  <span className="text-muted-foreground text-xs block">Impact Realm</span>
                  <Badge variant="outline">{data.impact.realm.label}</Badge>
                </div>
              )}
              {data.impact?.side && (
                <div>
                  <span className="text-muted-foreground text-xs block">Impact Side</span>
                  <Badge variant="outline">{data.impact.side.label}</Badge>
                </div>
              )}
            </div>
            {data.addons && data.addons.length > 0 && (
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Addons</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.addons.slice(0, 8).map((addon) => (
                    <Badge
                      key={addon.slot}
                      variant="secondary"
                      className="text-[11px]"
                      title={addon.description ?? addon.label}
                    >
                      #{addon.slot} {addon.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.specAddons && data.specAddons.length > 0 && (
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Spec Addons (EMSPECA)</span>
                <div className="flex flex-wrap gap-1.5">
                  {data.specAddons.slice(0, 8).map((spec) => (
                    <Badge
                      key={spec.slot}
                      variant="outline"
                      className="text-[11px]"
                      title={spec.description ?? spec.label}
                    >
                      #{spec.slot} {spec.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.description && (
              <div>
                <span className="text-muted-foreground text-xs block mb-1">Description</span>
                <p className="text-sm leading-relaxed">{data.description}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function BuildSkillsSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const stringsFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingStrings, setUploadingStrings] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const [skills, setSkills] = useState<SkillPreviewEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cacheInfo, setCacheInfo] = useState<{
    loaded: boolean;
    count: number;
    loadedAt: string | null;
    version: string;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const limit = 50;

  const loadPreview = useCallback(async (p: number, s: string) => {
    setPreviewLoading(true);
    try {
      const res = await getSkillsPreview(p, limit, s);
      setSkills(res.skills);
      setTotal(res.total);
      setPage(res.page);
      setCacheInfo(res.info);
    } catch {
      setSkills([]);
      setTotal(0);
      setCacheInfo(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreview(1, "");
  }, [loadPreview]);

  async function handleUploadAndBuild() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a Skill.csv file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Only .csv files are allowed.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadAndBuildSkills(file);
      toast.success(res.message || `Built ${res.skillCount} skills.`);
      if (fileRef.current) fileRef.current.value = "";
      loadPreview(1, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRebuild() {
    setRebuilding(true);
    try {
      const res = await triggerBuildSkills();
      toast.success(res.message || `Rebuilt ${res.skillCount} skills.`);
      loadPreview(1, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rebuild failed.");
    } finally {
      setRebuilding(false);
    }
  }

  async function handleUploadStrings() {
    const file = stringsFileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a skill strings XML/TXT file first.");
      return;
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xml") && !lower.endsWith(".txt")) {
      toast.error("Only .xml or .txt files are allowed.");
      return;
    }

    setUploadingStrings(true);
    try {
      const res = await uploadSkillStrings(file);
      toast.success(res.message || `Built ${res.stringsCount} skill strings.`);
      if (stringsFileRef.current) stringsFileRef.current.value = "";
      loadPreview(1, search);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingStrings(false);
    }
  }

  function handleSearch() {
    setSearch(searchInput);
    loadPreview(1, searchInput);
  }

  const busy = uploading || rebuilding || uploadingStrings;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Build Skills</CardTitle>
          <CardDescription>
            Upload a Skill.csv or rebuild the skills JSON from the existing CSV file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="skill-csv">Upload Skill.csv</Label>
            <div className="flex items-center gap-3">
              <Input
                id="skill-csv"
                ref={fileRef}
                type="file"
                accept=".csv"
                disabled={busy}
                className="max-w-sm"
              />
              <Button onClick={handleUploadAndBuild} disabled={busy} className="gap-2">
                <Upload className={`h-4 w-4 ${uploading ? "animate-pulse" : ""}`} />
                {uploading ? "Uploading..." : "Upload & Build"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This replaces the existing Skill.csv and regenerates skills data.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="skill-strings">Upload Skill Strings (.xml/.txt)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="skill-strings"
                ref={stringsFileRef}
                type="file"
                accept=".xml,.txt,text/plain,text/xml,application/xml"
                disabled={busy}
                className="max-w-sm"
              />
              <Button onClick={handleUploadStrings} disabled={busy} className="gap-2" variant="secondary">
                <Upload className={`h-4 w-4 ${uploadingStrings ? "animate-pulse" : ""}`} />
                {uploadingStrings ? "Uploading..." : "Upload Strings"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports SN_/SD_ entries. SN maps skill name, SD maps skill description by matching ID.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRebuild}
              disabled={busy}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${rebuilding ? "animate-spin" : ""}`} />
              {rebuilding ? "Rebuilding..." : "Rebuild from Existing CSV"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Re-process current Skill.csv without uploading a new file.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Skills Preview
              </CardTitle>
              <CardDescription>
                {cacheInfo?.loaded
                  ? `${cacheInfo.count.toLocaleString()} skills loaded`
                  : "No skills data loaded yet. Build skills first."}
                {cacheInfo?.loadedAt && (
                  <> · Last loaded: {new Date(cacheInfo.loadedAt).toLocaleString()}</>
                )}
              </CardDescription>
            </div>
            {cacheInfo?.version && (
              <Badge variant="outline" className="text-xs">
                {cacheInfo.version}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, main/sub, or name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {previewLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : skills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {cacheInfo?.loaded
                ? "No skills match your search."
                : "No skills data available. Upload a CSV and build first."}
            </p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Skill ID</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-right font-medium">Main</th>
                    <th className="px-3 py-2 text-right font-medium">Sub</th>
                    <th className="px-3 py-2 text-left font-medium">Class</th>
                    <th className="px-3 py-2 text-right font-medium">Grade</th>
                    <th className="px-3 py-2 text-right font-medium">Max Lv</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((skill) => (
                    <tr
                      key={skill.skillId}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedSkillId(skill.skillId)}
                    >
                      <td className="px-3 py-1.5 font-mono text-xs">{skill.skillId}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{skill.name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{skill.mainId}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{skill.subId}</td>
                      <td className="px-3 py-1.5">
                        <Badge
                          variant="outline"
                          className="text-[11px]"
                          title={
                            skill.classInfo
                              ? `Mask: ${skill.classInfo.glccValue} (${skill.classInfo.glccHex})\n${skill.classInfo.glccBits.join(" | ")}`
                              : ""
                          }
                        >
                          {skill.classInfo?.group ?? "None"}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{skill.grade ?? "-"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {skill.maxLevel ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of{" "}
                {total.toLocaleString()} skills
                {search && " (filtered)"}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1 || previewLoading}
                  onClick={() => loadPreview(page - 1, search)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= totalPages || previewLoading}
                  onClick={() => loadPreview(page + 1, search)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SkillDetailModal
        open={!!selectedSkillId}
        onClose={() => setSelectedSkillId(null)}
        skillId={selectedSkillId}
      />
    </div>
  );
}

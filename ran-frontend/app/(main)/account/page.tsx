"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ComboboxDemo } from "@/components/reusable/combobox";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/context/AuthContext";
import {
  fetchUserDetails,
  AccountInfo,
  changePassword,
  changeEmail,
  changePincode,
  AccountAction,
} from "@/lib/data/account.data";
import {
  getMyCharacters,
  Character,
  deleteCharacter,
  changeSchool,
  resetStats,
  rebornCharacter,
  changeClass,
  getRebornPreview,
  RebornPreviewResponse,
} from "@/lib/data/character.data";
import {
  classOptions,
  schoolOptions,
  schoolOptionsNumToText,
} from "@/constants/character.constant";
import { usePublicConfig } from "@/context/PublicConfigContext";
import {
  getTopupHistory,
  redeemTopup,
  TopupHistoryItem,
} from "@/lib/data/topup.data";
import { useT } from "@/context/LanguageContext";

export default function AccountPanel() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useT();

  const [selectedOption, setSelectedOption] = useState("account");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const shown = useRef(false);

  // Modal type
  const [openModal, setOpenModal] = useState<
    "password" | "email" | "pincode" | null
  >(null);

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [confirmOldPassword, setConfirmOldPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [confirmPincode, setConfirmPincode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Email states
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);

  // Pincode states
  const [oldPin, setOldPin] = useState("");
  const [confirmOldPin, setConfirmOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [emailForPin, setEmailForPin] = useState("");
  const [confirmEmailForPin, setConfirmEmailForPin] = useState("");
  const [loadingPin, setLoadingPin] = useState(false);

  // DeleteCharacter
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Account Actions
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Top Up
  const [topupHistory, setTopupHistory] = useState<TopupHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [topupCode, setTopupCode] = useState("");
  const [topupPin, setTopupPin] = useState("");
  const [loadingRedeem, setLoadingRedeem] = useState(false);

  const { config: publicConfig, loadingConfig } = usePublicConfig();
  const accountPanelOptions = [
    { label: t.account.manageAccount, value: "account" },
    { label: t.account.manageCharacters, value: "characters" },

    ...(publicConfig?.gameoptions?.changeSchool?.enabled
      ? [{ label: t.account.changeSchool, value: "changeSchool" as const }]
      : []),

    ...(publicConfig?.gameoptions?.resetStats?.enabled
      ? [{ label: t.account.resetStats, value: "resetStats" as const }]
      : []),

    ...(publicConfig?.gameoptions?.reborn?.enabled
      ? [{ label: t.account.rebornCharacter, value: "reborn" as const }]
      : []),

    ...(publicConfig?.gameoptions?.changeClass?.enabled
      ? [{ label: t.account.changeClass, value: "changeClass" as const }]
      : []),

    ...(publicConfig?.features.topUp
      ? [{ label: t.account.topUp, value: "topUp" as const }]
      : []),

    ...(publicConfig?.features.topUp
      ? [{ label: t.account.topUpHistory, value: "topUpHistory" as const }]
      : []),
  ];

  const enabledClassOptions = classOptions.filter((cls) => {
    return publicConfig?.gameoptions?.classes?.[cls.value];
  });

  // Reborn Logic
  const selectedCharacter = characters.find((c) => c.id === selectedCharId);
  const currentReborn = selectedCharacter?.reborn ?? 0;
  const rebornTier = publicConfig?.gameoptions?.reborn?.tiers?.find(
    (tier) => currentReborn >= tier.from && currentReborn <= tier.to,
  );

  /* --------------------------------------------------
     Auth Guard
  -------------------------------------------------- */
  useEffect(() => {
    if (!authLoading && !user && !shown.current) {
      toast.error("You must login first.");
      shown.current = true;
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (selectedOption !== "topUpHistory") return;

    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const history = await getTopupHistory();
        setTopupHistory(history);
      } catch (err: any) {
        toast.error(err.message || "Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [selectedOption]);

  const totalRedeemed = topupHistory.reduce(
    (sum, item) => sum + Number(item.value),
    0,
  );

  /* --------------------------------------------------
     Load Account
  -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const data = await fetchUserDetails();
        console.log(publicConfig);
        setAccount(data);
      } catch {
        toast.error("Failed to fetch account info.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  /* --------------------------------------------------
     Load Characters
  -------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    if (
      ![
        "characters",
        "changeSchool",
        "resetStats",
        "reborn",
        "changeClass",
      ].includes(selectedOption)
    )
      return;

    //if (characters.length > 0) return;

    async function loadChars() {
      try {
        const data = await getMyCharacters();
        setCharacters(data);
      } catch {
        toast.error("Failed to load characters.");
      }
    }

    loadChars();
  }, [selectedOption, user, characters.length]);

  const schoolMap = Object.fromEntries(
    schoolOptionsNumToText.map((s) => [s.value, s.label]),
  );

  // Reborn Loader
  const [rebornPreview, setRebornPreview] =
    useState<RebornPreviewResponse | null>(null);

  useEffect(() => {
    if (selectedOption === "reborn" && selectedCharId) {
      getRebornPreview(selectedCharId)
        .then((res) => {
          if (res.ok) setRebornPreview(res.data);
        })
        .catch(() => setRebornPreview(null));
    }
  }, [selectedOption, selectedCharId]);

  /* --------------------------------------------------
     Reset Helpers
  -------------------------------------------------- */
  function resetPasswordForm() {
    setOldPassword("");
    setConfirmOldPassword("");
    setPincode("");
    setConfirmPincode("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  function resetEmailForm() {
    setNewEmail("");
    setConfirmEmail("");
    setPincode("");
  }

  function resetPinForm() {
    setOldPin("");
    setConfirmOldPin("");
    setNewPin("");
    setConfirmNewPin("");
    setEmailForPin("");
    setConfirmEmailForPin("");
  }

  /* --------------------------------------------------
     Password Change
  -------------------------------------------------- */
  async function handlePasswordChange() {
    if (
      !oldPassword ||
      !confirmOldPassword ||
      !pincode ||
      !confirmPincode ||
      !newPassword ||
      !confirmNewPassword
    ) {
      toast.error(t.account.errors.allRequired);
      return;
    }

    if (oldPassword !== confirmOldPassword) {
      toast.error(t.account.errors.oldPwMismatch);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t.account.errors.newPwMismatch);
      return;
    }

    if (pincode !== confirmPincode) {
      toast.error(t.account.errors.pinMismatch);
      return;
    }

    try {
      setLoadingPassword(true);

      const res = await changePassword(
        oldPassword,
        confirmOldPassword,
        pincode,
        confirmPincode,
        newPassword,
        confirmNewPassword,
      );

      toast.success(res.message);

      setOpenModal(null);
      resetPasswordForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  }

  /* --------------------------------------------------
     Email Change
  -------------------------------------------------- */
  async function handleEmailChange() {
    if (!newEmail || !confirmEmail || !pincode) {
      toast.error(t.account.errors.allRequired);
      return;
    }

    if (newEmail !== confirmEmail) {
      toast.error(t.account.errors.emailMismatch);
      return;
    }

    try {
      setLoadingEmail(true);

      const res = await changeEmail(newEmail, confirmEmail, pincode);

      toast.success(res.message);

      await fetchUserDetails().then(setAccount);

      setOpenModal(null);
      resetEmailForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to change email");
    } finally {
      setLoadingEmail(false);
    }
  }

  /* --------------------------------------------------
     Pincode Change
  -------------------------------------------------- */
  async function handlePincodeChange() {
    if (
      !oldPin ||
      !confirmOldPin ||
      !newPin ||
      !confirmNewPin ||
      !emailForPin ||
      !confirmEmailForPin
    ) {
      toast.error(t.account.errors.allRequired);
      return;
    }

    if (oldPin !== confirmOldPin) {
      toast.error(t.account.errors.oldPinMismatch);
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error(t.account.errors.newPinMismatch);
      return;
    }

    if (emailForPin !== confirmEmailForPin) {
      toast.error(t.account.errors.emailMismatch);
      return;
    }

    try {
      setLoadingPin(true);

      const res = await changePincode(
        oldPin,
        confirmOldPin,
        newPin,
        confirmNewPin,
        emailForPin,
        confirmEmailForPin,
      );

      toast.success(res.message);

      setOpenModal(null);
      resetPinForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to change pincode");
    } finally {
      setLoadingPin(false);
    }
  }

  // Delete Character
  async function handleDeleteCharacter(id: number) {
    const confirmed = confirm(t.account.errors.confirmDelete);

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const res = await deleteCharacter(id);

      toast.success(res);

      // Remove from UI instantly
      setCharacters((prev) => prev.filter((char) => char.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete character");
    } finally {
      setDeletingId(null);
    }
  }

  // Account Action
  async function handleCharacterAction() {
    if (!selectedCharId) {
      toast.error(t.account.errors.selectCharacter);
      return;
    }

    try {
      setLoadingAction(true);

      let message = "";

      if (selectedOption === "changeSchool") {
        if (selectedSchool === null) {
          toast.error(t.account.errors.selectSchool);
          return;
        }

        message = await changeSchool(selectedCharId, selectedSchool);
      }

      if (selectedOption === "resetStats") {
        message = await resetStats(selectedCharId);
      }

      if (selectedOption === "reborn") {
        const res = await rebornCharacter(selectedCharId);
        message = res.message;

        const data = await getMyCharacters();
        setCharacters(data);

        const preview = await getRebornPreview(selectedCharId);
        if (preview.ok) {
          setRebornPreview(preview.data);
        }
      }

      if (selectedOption === "changeClass") {
        if (!selectedClass) {
          toast.error(t.account.errors.selectClass);
          return;
        }

        message = await changeClass(selectedCharId, selectedClass);
      }

      toast.success(message);
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setLoadingAction(false);
    }
  }

  const { refresh } = useAuth();
  // Top Up
  async function handleRedeemTopup() {
    if (!topupCode || !topupPin) {
      toast.error(t.account.errors.codeAndPinRequired);
      return;
    }

    try {
      setLoadingRedeem(true);

      const res = await redeemTopup(topupCode, topupPin);

      toast.success(res.message);

      await refresh(); // <-- THIS is the missing piece

      const history = await getTopupHistory();
      setTopupHistory(history);

      setTopupCode("");
      setTopupPin("");
    } catch (err: any) {
      toast.error(err.message || "Redeem failed.");
    } finally {
      setLoadingRedeem(false);
    }
  }

  /* --------------------------------------------------
     Loading UI
  -------------------------------------------------- */
  if (authLoading || loading) {
    return (
      <div className="container mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t.account.title}</CardTitle>
          <CardDescription>{t.account.subtitle}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="pb-4">
            <ComboboxDemo
              options={accountPanelOptions}
              value={selectedOption}
              onChange={(val) => setSelectedOption(val)}
            />
          </div>
          {selectedOption === "account" && account && (
            <>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{t.account.userId}</TableCell>
                    <TableCell>{account.userid}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t.account.email}</TableCell>
                    <TableCell>{account.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t.account.characterSlots}</TableCell>
                    <TableCell>{account.chaRemain}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{ publicConfig?.ePointsName}</TableCell>
                    <TableCell>{account.epoint}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{t.account.vPoints}</TableCell>
                    <TableCell>{account.vpoint}</TableCell>
                  </TableRow>
                  {account.type > 10 && (
                    <TableRow>
                      <TableCell className="font-medium">{t.account.accountType}</TableCell>
                      <TableCell>{account.type}</TableCell>
                    </TableRow>
                  )}

                  <TableRow>
                    <TableCell className="font-medium">{t.account.accountStatus}</TableCell>
                    <TableCell>
                      {account.blocked ? t.account.statusBlocked : t.account.statusActive}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-4 flex gap-2">
                {publicConfig?.features.changePassword && (
                  <Button
                    onClick={() => {
                      resetPasswordForm();
                      setOpenModal("password");
                    }}
                  >
                    {t.account.changePassword}
                  </Button>
                )}

                {publicConfig?.features.changeEmail && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetEmailForm();
                      setOpenModal("email");
                    }}
                  >
                    {t.account.changeEmail}
                  </Button>
                )}

                {publicConfig?.features.changePin && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      resetPinForm();
                      setOpenModal("pincode");
                    }}
                  >
                    {t.account.changePin}
                  </Button>
                )}
              </div>
            </>
          )}

          {selectedOption === "characters" && (
            <>
              {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.account.noCharacters}
                </p>
              ) : (
                <Table>
                  <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                      <th className="text-left py-2">{t.account.characterName}</th>
                      <th className="text-left py-2">{t.account.level} ({t.account.reborn})</th>
                      <th className="text-left py-2">{t.account.school}</th>
                      <th className="text-left py-2">{t.account.gold}</th>
                      <th className="text-left py-2">{t.account.status}</th>
                    </tr>
                  </thead>
                  <TableBody>
                    {characters.map((char) => (
                      <TableRow key={char.id}>
                        <TableCell>{char.name}</TableCell>
                        <TableCell>
                          {char.level}
                          {char.reborn > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({char.reborn})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {schoolMap[char.school] ?? "Unknown"}
                        </TableCell>

                        <TableCell>
                          {(char.money ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-semibold ${
                              char.isOnline
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {char.isOnline ? t.account.statusOnline : t.account.statusOffline}
                          </span>
                        </TableCell>

                        {publicConfig?.features.characterDelete && (
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === char.id}
                              onClick={() => handleDeleteCharacter(char.id)}
                            >
                              {deletingId === char.id ? t.common.deleting : t.account.deleteCharacter}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>

        {selectedOption === "topUp" && (
          <>
            <CardContent>
              <div className="flex justify-center py-6">
                <div className="w-full max-w-md space-y-6">
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold">{t.account.topUpRedeemTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t.account.topUpRedeemDesc}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.account.topUpCode}</Label>
                    <Input
                      value={topupCode}
                      onChange={(e) => setTopupCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.account.pin}</Label>
                    <Input
                      value={topupPin}
                      onChange={(e) => setTopupPin(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleRedeemTopup}
                    disabled={loadingRedeem}
                    className="w-full"
                  >
                    {loadingRedeem ? t.common.processing : t.account.redeem}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {selectedOption === "topUpHistory" && (
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="w-full max-w-3xl space-y-6">
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-semibold">{t.account.topUpHistoryTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.account.topUpHistoryDesc}
                  </p>
                </div>

                <div className="rounded-md border bg-muted/40 p-4 text-sm flex justify-between items-center">
                  <span className="text-muted-foreground">{t.account.totalRedeemed}</span>
                  <span className="font-semibold text-foreground">
                    {totalRedeemed.toLocaleString()} EP
                  </span>
                </div>

                {loadingHistory ? (
                  <p className="text-sm text-muted-foreground">{t.common.loading}</p>
                ) : topupHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t.account.noHistory}
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr className="border-b text-sm text-muted-foreground">
                        <th className="text-left py-2">{t.account.code}</th>
                        <th className="text-left py-2">{t.account.value}</th>
                        <th className="text-left py-2">{t.account.date}</th>
                      </tr>
                    </thead>
                    <TableBody>
                      {topupHistory.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.code}</TableCell>
                          <TableCell>{item.value.toLocaleString()}</TableCell>
                          <TableCell>
                            {new Date(item.usedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>
        )}

        {/* Account Action */}
        {["changeSchool", "resetStats", "reborn", "changeClass"].includes(
          selectedOption,
        ) && (
          <div className="flex justify-center py-6">
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold">
                  {selectedOption === "changeSchool" && t.account.changeSchool}
                  {selectedOption === "resetStats" && t.account.resetStats}
                  {selectedOption === "reborn" && t.account.rebornTitle}
                  {selectedOption === "changeClass" && t.account.changeClass}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {t.account.selectCharacterHint}
                </p>
              </div>

              {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  {t.account.noCharactersAvailable}
                </p>
              ) : (
                <>
                  {/* Character Dropdown */}
                  <div className="space-y-2">
                    <Label>{t.account.characterLabel}</Label>
                    <ComboboxDemo
                      options={characters.map((char) => ({
                        label: `${char.name} • Lv ${char.level}${
                          char.reborn > 0 ? ` (${char.reborn})` : ""
                        }`,
                        value: String(char.id),
                      }))}
                      value={selectedCharId ? String(selectedCharId) : ""}
                      onChange={(val) => setSelectedCharId(Number(val))}
                    />
                  </div>
                  {/* Change School */}
                  {selectedOption === "changeSchool" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.account.schoolLabel}</Label>

                        <ComboboxDemo
                          options={schoolOptions.map((s) => ({
                            label: s.label,
                            value: String(s.value),
                          }))}
                          value={selectedSchool ?? ""}
                          onChange={(val) => setSelectedSchool(val)}
                        />
                      </div>

                      {/* Info Section */}
                      <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                        <p>
                          {t.account.fee}{" "}
                          <span className="font-semibold">
                            {publicConfig?.gameoptions?.changeSchool?.fee?.toLocaleString()}{" "}
                            {publicConfig?.gameoptions?.changeSchool?.currency?.toUpperCase()}
                          </span>
                        </p>

                        <p className="text-muted-foreground">
                          {t.account.changeSchoolWarning}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Change Class */}
                  {selectedOption === "changeClass" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t.account.classLabel}</Label>
                        <ComboboxDemo
                          options={enabledClassOptions}
                          value={selectedClass}
                          onChange={(val) => setSelectedClass(val)}
                        />
                      </div>

                      <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                        <p>
                          {t.account.fee}{" "}
                          <span className="font-semibold">
                            {publicConfig?.gameoptions?.changeClass?.fee?.toLocaleString()}{" "}
                            {publicConfig?.gameoptions?.changeClass?.currency?.toUpperCase()}
                          </span>
                        </p>

                        <p className="text-muted-foreground">
                          {t.account.changeClassWarning}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Reset Stats */}
                  {selectedOption === "resetStats" && (
                    <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-1 text-center">
                      <p>
                        {t.account.resetStatsRequires}{" "}
                        <span className="font-semibold text-foreground">
                          {publicConfig?.gameoptions?.resetStats?.fee?.toLocaleString()}{" "}
                          {publicConfig?.gameoptions?.resetStats?.currency?.toUpperCase()}
                        </span>
                        .
                      </p>

                      <p className="text-muted-foreground">
                        {t.account.resetStatsWarning}
                      </p>
                    </div>
                  )}
                  {/* Reborn */}
                  {selectedOption === "reborn" && (
                    <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-2 text-center">
                      {rebornPreview ? (
                        <>
                          <p>
                            {t.account.rebornRequires}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.requiredFee?.toLocaleString()}{" "}
                              {rebornPreview.currency?.toUpperCase()}
                            </span>
                            .
                          </p>

                          <p>
                            {t.account.requiredLevelLabel}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.requiredLevel}
                            </span>
                          </p>

                          <p>
                            {t.account.currentRebornLabel}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.currentReborn}
                            </span>
                          </p>

                          <p>
                            {t.account.afterRebornLabel}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.nextReborn}
                            </span>
                          </p>

                          <p className="text-muted-foreground">
                            {t.account.gainStats}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.statRewardForNext}
                            </span>{" "}
                            {t.account.gainStatsSuffix}
                          </p>

                          <p className="text-muted-foreground">
                            {t.account.totalBonusStats}{" "}
                            <span className="font-semibold text-foreground">
                              {rebornPreview.totalStatAfter}
                            </span>
                          </p>

                          {/* Status */}
                          {!rebornPreview.canReborn && (
                            <p className="text-destructive font-medium pt-2">
                              {rebornPreview.reason === "REBORN_MAX_REACHED"
                                ? t.account.rebornMaxReached
                                : rebornPreview.reason ===
                                    "LEVEL_REQUIREMENT_NOT_MET"
                                  ? t.account.levelNotMet
                                  : t.account.cannotReborn}
                            </p>
                          )}

                          {rebornPreview.canReborn && (
                            <p className="text-green-600 font-medium pt-2">
                              {t.account.eligibleReborn}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          {t.account.loadingReborn}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleCharacterAction}
                    disabled={
                      !selectedCharId ||
                      loadingAction ||
                      (selectedOption === "changeSchool" && !selectedSchool) ||
                      (selectedOption === "changeClass" && !selectedClass)
                    }
                    className="w-full"
                    variant={
                      selectedOption === "reborn" ? "destructive" : "default"
                    }
                  >
                    {loadingAction ? t.common.processing : t.common.confirm}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          {t.account.securityNote}
        </CardFooter>
      </Card>

      {/* MODAL */}
      <Dialog open={openModal !== null} onOpenChange={() => setOpenModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {openModal === "password"
                ? t.account.changePassword
                : openModal === "email"
                  ? t.account.changeEmail
                  : t.account.changePin}
            </DialogTitle>
          </DialogHeader>

          {/* PASSWORD FORM */}
          {openModal === "password" && (
            <div className="space-y-3">
              <Label>{t.account.oldPassword}</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />

              <Label>{t.account.confirmOldPassword}</Label>
              <Input
                type="password"
                value={confirmOldPassword}
                onChange={(e) => setConfirmOldPassword(e.target.value)}
              />

              <Label>{t.account.pincode}</Label>
              <Input
                type="password"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />

              <Label>{t.account.confirmPincode}</Label>
              <Input
                type="password"
                value={confirmPincode}
                onChange={(e) => setConfirmPincode(e.target.value)}
              />

              <Label>{t.account.newPassword}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Label>{t.account.confirmNewPassword}</Label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />

              <DialogFooter>
                <Button
                  onClick={handlePasswordChange}
                  disabled={loadingPassword}
                >
                  {loadingPassword ? t.common.saving : t.common.confirm}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* EMAIL FORM */}
          {openModal === "email" && (
            <div className="space-y-3">
              <Label>{t.account.newEmail}</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />

              <Label>{t.account.confirmEmail}</Label>
              <Input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />

              <Label>{t.account.pincode}</Label>
              <Input
                type="password"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />

              <DialogFooter>
                <Button onClick={handleEmailChange} disabled={loadingEmail}>
                  {loadingEmail ? t.common.saving : t.common.confirm}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* PINCODE FORM */}
          {openModal === "pincode" && (
            <div className="space-y-3">
              <Label>{t.account.oldPincode}</Label>
              <Input
                type="password"
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
              />

              <Label>{t.account.confirmOldPincode}</Label>
              <Input
                type="password"
                value={confirmOldPin}
                onChange={(e) => setConfirmOldPin(e.target.value)}
              />

              <Label>{t.account.newPincode}</Label>
              <Input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
              />

              <Label>{t.account.confirmNewPincode}</Label>
              <Input
                type="password"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
              />

              <Label>{t.account.emailLabel}</Label>
              <Input
                type="email"
                value={emailForPin}
                onChange={(e) => setEmailForPin(e.target.value)}
              />

              <Label>{t.account.confirmEmail}</Label>
              <Input
                type="email"
                value={confirmEmailForPin}
                onChange={(e) => setConfirmEmailForPin(e.target.value)}
              />

              <DialogFooter>
                <Button onClick={handlePincodeChange} disabled={loadingPin}>
                  {loadingPin ? t.common.saving : t.common.confirm}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

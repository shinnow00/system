"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";
import DiscordLayout from "@/components/DiscordLayout";
import { Department } from "@/utils/departments";
import DesignView from "@/components/views/DesignView";
import SocialView from "@/components/views/SocialView";
import AccountsView from "@/components/views/AccountsView";
import HrView from "@/components/views/HrView";
import OpsView from "@/components/views/OpsView";
import FinanceView from "@/components/views/FinanceView";
import SuperAdminView from "@/components/views/SuperAdminView";
import ChatArea from "@/components/ChatArea";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import { Loader2 } from "lucide-react";

import UnassignedView from "@/components/views/UnassignedView";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="text-discord-blurple animate-spin" />
        <p className="text-discord-text-muted">Loading...</p>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const urlDept = searchParams.get("dept") as Department | null;
  const urlChannel = searchParams.get("channel");

  const [activeDepartment, setActiveDepartment] = useState<Department>(urlDept || "design");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShadow, setIsShadow] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isGeneralChat, setIsGeneralChat] = useState(urlChannel === "general");
  const [currentChannel, setCurrentChannel] = useState(urlChannel || "general");

  // Sub-filters initialized from URL if possible
  const [designFilter, setDesignFilter] = useState(activeDepartment === "design" ? urlChannel || "my-tasks" : "my-tasks");
  const [socialFilter, setSocialFilter] = useState(activeDepartment === "social" ? urlChannel || "calendar" : "calendar");
  const [hrFilter, setHrFilter] = useState(activeDepartment === "hr" ? urlChannel || "attendance" : "attendance");
  const [financeFilter, setFinanceFilter] = useState<"payments" | "sales" | "inventory">(
    activeDepartment === "finance" ? (urlChannel as any) || "payments" : "payments"
  );
  const [opsFilter, setOpsFilter] = useState(activeDepartment === "ops" ? urlChannel || "tracking" : "tracking");

  // Update URL helper
  const updateUrl = (dept: string, channel: string) => {
    const params = new URLSearchParams();
    params.set("dept", dept);
    params.set("channel", channel);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const supabase = createClient();

      // Check if user is logged in
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Fetch user profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setProfile({
          id: user.id,
          email: user.email || "",
          full_name: null,
          role: null,
          department: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setProfile(profileData);
        // Only set default department if one isn't in the URL
        if (profileData.department && !urlDept) {
          setActiveDepartment(profileData.department);
          // When setting default dept, also update URL if needed
          const defaultChannel = profileData.department === "design" ? "my-tasks" :
            profileData.department === "social" ? "calendar" :
              profileData.department === "hr" ? "attendance" :
                profileData.department === "finance" ? "payments" :
                  profileData.department === "ops" ? "tracking" : "general";
          updateUrl(profileData.department, defaultChannel);
        }
      }

      if (user.email === "xshinnow@x.com") {
        setIsShadow(true);
      }

      setLoading(false);
    };

    checkAuthAndFetchProfile();
  }, [router, urlDept]);

  // Sync URL when state changes
  useEffect(() => {
    if (loading) return;

    let channel = "general";
    if (!isGeneralChat) {
      if (activeDepartment === "design") channel = designFilter;
      else if (activeDepartment === "social") channel = socialFilter;
      else if (activeDepartment === "hr") channel = hrFilter;
      else if (activeDepartment === "finance") channel = financeFilter;
      else if (activeDepartment === "ops") channel = opsFilter;
      else channel = currentChannel;
    }

    updateUrl(activeDepartment, channel);
  }, [activeDepartment, isGeneralChat, designFilter, socialFilter, hrFilter, financeFilter, opsFilter, currentChannel, loading]);

  const handleDepartmentChange = (dept: Department) => {
    setActiveDepartment(dept);
    setIsGeneralChat(false);
    // Set default channel for the new department to avoid staying on a channel that doesn't exist in the new dept
    if (dept === "design") setDesignFilter("my-tasks");
    else if (dept === "social") setSocialFilter("calendar");
    else if (dept === "hr") setHrFilter("attendance");
    else if (dept === "finance") setFinanceFilter("payments");
    else if (dept === "ops") setOpsFilter("tracking");
  };

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Gatekeeper: Check for unassigned role
  if (!profile?.role && !isShadow) {
    return <UnassignedView />;
  }

  const renderViews = () => {
    return (
      <>
        <div className={(isGeneralChat || activeDepartment === "home") ? "flex flex-col flex-1 h-full" : "hidden"}>
          <ChatArea userProfile={profile} channelId={currentChannel} />
        </div>

        {!isGeneralChat && (
          <>
            <div className={activeDepartment === "design" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <DesignView
                key={`design-${refreshKey}`}
                userRole={profile?.role as any}
                filter={designFilter}
                currentUserId={profile?.id}
              />
            </div>

            <div className={activeDepartment === "social" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <SocialView key={`social-${refreshKey}`} filter={socialFilter} />
            </div>

            <div className={activeDepartment === "accounts" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <AccountsView key={`accounts-${refreshKey}`} />
            </div>

            <div className={activeDepartment === "hr" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <HrView key={`hr-${refreshKey}`} filter={hrFilter} />
            </div>

            <div className={activeDepartment === "ops" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <OpsView key={`ops-${refreshKey}`} filter={opsFilter} />
            </div>

            <div className={activeDepartment === "finance" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <FinanceView key={`finance-${refreshKey}`} filter={financeFilter} />
            </div>

            <div className={activeDepartment === "superadmin" ? "flex flex-col flex-1 h-full" : "hidden"}>
              <SuperAdminView userEmail={profile?.email} />
            </div>
          </>
        )}
      </>
    );
  };

  const handleTaskCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <DiscordLayout
        activeDepartment={activeDepartment}
        onDepartmentChange={handleDepartmentChange}
        isShadow={isShadow}
        userProfile={profile}
        onCreateTask={() => setCreateTaskOpen(true)}
        isGeneralChat={isGeneralChat}
        onToggleGeneralChat={setIsGeneralChat}
        activeChannel={isGeneralChat ? "general" : activeDepartment === "design" ? designFilter : activeDepartment === "social" ? socialFilter : activeDepartment === "hr" ? hrFilter : activeDepartment === "finance" ? financeFilter : activeDepartment === "ops" ? opsFilter : currentChannel}
        socialFilter={socialFilter}
        setSocialFilter={setSocialFilter}
        hrFilter={hrFilter}
        setHrFilter={setHrFilter}
        financeFilter={financeFilter}
        setFinanceFilter={setFinanceFilter}
        opsFilter={opsFilter}
        setOpsFilter={setOpsFilter}
        onChannelChange={(id) => {
          if (activeDepartment === "design") {
            setDesignFilter(id);
          } else if (activeDepartment === "finance") {
            setFinanceFilter(id as any);
          } else if (activeDepartment === "ops") {
            setOpsFilter(id);
          } else if (activeDepartment === "hr") {
            setHrFilter(id);
          } else if (activeDepartment === "social") {
            setSocialFilter(id);
          } else {
            setCurrentChannel(id);
          }
        }}
      >
        {renderViews()}
      </DiscordLayout>

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        activeDepartment={activeDepartment}
        socialFilter={socialFilter}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}

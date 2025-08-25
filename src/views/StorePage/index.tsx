import { useQuery } from "@tanstack/react-query";
import PageLayout from "@src/components/common/PageLayout";
import { remoteAdminAPI } from "@src/lib/api/remote/admin";
import { GetHomepageResponse } from "@src/lib/types/admin";
import Banner from "./components/Banner";
import Main from "./components/Main";

function MainPage() {
  const { data: adminData } = useQuery<GetHomepageResponse>({
    queryKey: ["homepage"],
    queryFn: remoteAdminAPI.getHomepage,
  });
  return (
    <PageLayout>
      <Banner mainColor={"#"} highColor={"#"} />
    </PageLayout>
  );
}

export default MainPage;

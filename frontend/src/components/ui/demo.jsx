import ContributionSkyline from "@/components/ui/contribution-skyline.jsx";

export default function Demo() {
  return (
    <div className="w-full bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-[980px]">
        <ContributionSkyline endDate="2017-11-08" />
      </div>
    </div>
  );
}

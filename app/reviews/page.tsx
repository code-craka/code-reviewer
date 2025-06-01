import { getUserReviewsAction } from "@/app/reviews/actions";
import { ReviewForm } from "@/components/review/ReviewForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDateTimeString } from "@/components/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ReviewsPage() {
  const { reviews, error } = await getUserReviewsAction();

  if (error) {
    return notFound();
  }

  return (
    <div className="container py-6">
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Code Reviews</h1>
          <TabsList>
            <TabsTrigger value="list">My Reviews</TabsTrigger>
            <TabsTrigger value="new">New Review</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          {reviews?.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven&apos;t created any reviews yet.
                </p>
              </CardContent>
            </Card>
          )}

          {reviews?.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {review.fileName || "Untitled Review"}
                    </CardTitle>
                    <CardDescription>
                      {review.language} • {getDateTimeString(review.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" asChild>
                      <Link href={`/reviews/${review.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <div className="text-sm px-2.5 py-0.5 rounded-full bg-muted">
                    {review.modelName}
                  </div>
                  <div className="text-sm px-2.5 py-0.5 rounded-full bg-muted">
                    {review.depth} review
                  </div>
                  <div className="text-sm px-2.5 py-0.5 rounded-full bg-muted">
                    {review.results?.length || 0} findings
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="new">
          <ReviewForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TestUI() {
  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight mb-6">UI Components Test</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>This is a shadcn/ui card component</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This card demonstrates that shadcn/ui components are working correctly with proper styling.</p>
            <div className="flex gap-2 mb-4">
              <Badge>Badge 1</Badge>
              <Badge variant="secondary">Badge 2</Badge>
              <Badge variant="outline">Badge 3</Badge>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Submit</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles from shadcn/ui</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

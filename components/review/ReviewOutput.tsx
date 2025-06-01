
'use client';
import React from 'react';
import { Review } from '@/types/index';
import Spinner from '@/components/ui/Spinner';
import { Bot, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import AlertComponent from '@/components/ui/CustomAlert'; // Using the refactored Alert

const ReviewOutput: React.FC<{ review: Review }> = ({ review }) => {
  // For proper markdown rendering, install and use a library like 'react-markdown'
  // import ReactMarkdown from 'react-markdown';
  // <ReactMarkdown className="prose prose-sm sm:prose-base lg:prose-lg prose-invert max-w-none">
  //   {review.feedback}
  // </ReactMarkdown>
  // For now, simple split for basic line breaks.

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="transition-all duration-300 hover:shadow-primary/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <Bot size={24} className="mr-2" />
            {review.modelName} Review
          </CardTitle>
          {review.isLoading && <Spinner className="ml-2 h-5 w-5 text-primary" />}
        </CardHeader>
        <CardContent>
          {review.error && (
            <AlertComponent type="error" title="Error" message={review.error} />
          )}

          {review.feedback && !review.error && (
            <div className="prose prose-sm sm:prose-base lg:prose-lg prose-invert max-w-none text-muted-foreground space-y-2">
              {review.feedback.split('\n').map((line, index, arr) => (
                <p key={index} className={`leading-relaxed ${line.trim() === '' && index < arr.length -1 ? 'my-1' : 'my-0'}`}>
                  {line || '\u00A0'} {}
                </p>
              ))}
            </div>
          )}

          {!review.isLoading && !review.feedback && !review.error && (
            <div className="text-muted-foreground flex items-center">
              <FileText size={20} className="mr-2" />
              No review data available or review is pending.
            </div>
          )}
        </CardContent>
        
        {(typeof review.tokensUsed === 'number' && review.tokensUsed > 0 && !review.isLoading && !review.error) || 
         (!review.isLoading && review.feedback && !review.error && review.feedback.toLowerCase().includes("appears to be well-written")) ? (
          <CardFooter className="flex flex-col items-start space-y-2 pt-4 border-t">
            {typeof review.tokensUsed === 'number' && review.tokensUsed > 0 && !review.isLoading && !review.error && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Tokens Used:</span> {review.tokensUsed}
              </div>
            )}
            {!review.isLoading && review.feedback && !review.error && review.feedback.toLowerCase().includes("appears to be well-written") && (
              <div className="text-green-500/80 text-sm flex items-center">
                  <CheckCircle size={18} className="mr-2" />
                  AI indicates the code is generally well-written.
              </div>
            )}
          </CardFooter>
        ) : null}
      </Card>
    </motion.div>
  );
};

export default ReviewOutput;

// Remember to add ShadCN UI components:
// npx shadcn-ui@latest add card
// AlertComponent is from components/ui/CustomAlert.tsx
// Spinner is from components/ui/Spinner.tsx
// Consider using a markdown parsing library like react-markdown for `review.feedback`
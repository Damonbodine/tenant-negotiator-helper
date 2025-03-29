
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function QuickTips() {
  return (
    <Card className="bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Quick Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-blue-100">
          <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 1</Badge>
          Start by building rapport. Briefly introduce yourself and why you like the property.
        </p>
        <p className="text-blue-100">
          <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 2</Badge>
          Ask open-ended questions to understand the landlord's needs and flexibility.
        </p>
        <p className="text-blue-100">
          <Badge variant="outline" className="mb-1 border-white/20 text-white mr-2">Tip 3</Badge>
          When stating your offer, provide reasoning based on market research or property condition.
        </p>
      </CardContent>
    </Card>
  );
}

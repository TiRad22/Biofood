import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Order from "@/pages/order";
import Kitchen from "@/pages/kitchen";
import NotFound from "@/pages/not-found";
import Analytics from "@/pages/analytics";
import Auth from "@/pages/auth";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/menu" component={Menu} />
        <Route 
          path="/order" 
          component={() => (
            <ProtectedRoute>
              <Order />
            </ProtectedRoute>
          )} 
        />
        <Route 
          path="/kitchen" 
          component={() => (
            <ProtectedRoute requiredRole="kitchen_staff">
              <Kitchen />
            </ProtectedRoute>
          )} 
        />
        <Route 
          path="/analytics" 
          component={() => (
            <ProtectedRoute requiredRole="kitchen_staff">
              <Analytics />
            </ProtectedRoute>
          )} 
        />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
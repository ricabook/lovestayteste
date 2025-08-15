-- Allow everyone to view basic profile information (needed for property owner cards)
CREATE POLICY "Everyone can view basic profile info" 
ON profiles 
FOR SELECT 
USING (true);

-- Allow everyone to view user roles (needed to determine if it's admin or proprietario)
CREATE POLICY "Everyone can view user roles" 
ON user_roles 
FOR SELECT 
USING (true);
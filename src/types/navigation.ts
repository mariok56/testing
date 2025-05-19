export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Verification: {email: string; password: string};
  ForgotPassword: undefined;
  ProductList: undefined;
  ProductDetail: {productId: string};
  ProfileEdit: undefined;
  AddProduct: undefined;
  EditProduct: {productId: string};
};

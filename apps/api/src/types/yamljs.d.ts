declare module "yamljs" {
  const YAML: {
    load: (path: string) => any;
  };
  export default YAML;
}

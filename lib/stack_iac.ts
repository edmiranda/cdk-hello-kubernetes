import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KubectlV27Layer } from '@aws-cdk/lambda-layer-kubectl-v27';

export class StackIaC extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const account = props?.env?.account!;
    const region = props?.env?.region!;

    // get VPC
    const tagName = 'vpc-secondary-cidr' // passed from construct stack props but using fixed value for example
    const vpc = ec2.Vpc.fromLookup(this, 'vpc', {
      tags: { 'Name': tagName}
    })
    
    const kubectl = new KubectlV27Layer(this, 'KubectlLayer');
    
    // provisiong a cluster
    const cluster = new eks.Cluster(this, 'hello-eks', {
      version: eks.KubernetesVersion.V1_27,
      kubectlLayer: kubectl,
      vpc: vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      clusterName: 'hello-eks',
      defaultCapacity: 0,
      endpointAccess: eks.EndpointAccess.PUBLIC,
      albController: {
        version: eks.AlbControllerVersion.V2_4_1,
      },
    });
    
    // Create node group
    cluster.addNodegroupCapacity('node-hello-eks-1', {
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 4,
      diskSize: 100,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      nodegroupName: 'node-hello-eks-1',
      tags: { Name: 'node-hello-eks-1' },
    });
    
    // adding access for iam role admin
    const admin = iam.Role.fromRoleArn(this, 'Role', `arn:aws:iam::${account}:role/admin`, {
      mutable: false,
    });
    
    cluster.awsAuth.addRoleMapping(admin, { groups: [ 'system:masters' ]});
    
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PageHeader from '../components/admin/PageHeader.jsx';
import EmptyState from '../components/admin/EmptyState.jsx';
import InviteTeamMemberModal from '../components/admin/InviteTeamMemberModal.jsx';
import RegistrationLinkModal from '../components/admin/RegistrationLinkModal.jsx';
import ConfirmActionModal from '../components/admin/ConfirmActionModal.jsx';
import TeamMemberProfileModal from '../components/admin/TeamMemberProfileModal.jsx';
import AccountStatusBadge from '../components/admin/AccountStatusBadge.jsx';
import DirectorySectionHeader from '../components/admin/DirectorySectionHeader.jsx';
import TeamAccessStatsGrid from '../components/admin/TeamAccessStatsGrid.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { memberTypeLabel } from '../utils/memberTypeLabel.js';
import { teamAccountStatusLabel } from '../utils/teamAccountStatusLabel.js';
import { formatDisplayDate } from '../utils/formatDisplayDate.js';
import { downloadOrgMembersCsv, downloadTeamMembersCsv } from '../utils/downloadPeopleCsv.js';
import {
  DESC_ADMIN_TEAM,
  DESC_STAFF_STUDENTS,
  INVITE_TEAM_MEMBER_LABEL,
  PEOPLE_DIRECTORY_LEAD,
  PEOPLE_DIRECTORY_TITLE,
  SHARE_REGISTRATION_LINK_LABEL,
  TAB_LABEL_ADMIN_TEAM,
  TAB_LABEL_STAFF_STUDENTS,
  TEAM_DIRECTORY_LEAD,
  TEAM_DIRECTORY_TITLE
} from '../utils/teamAccessCopy.js';
import * as userApi from '../api/userApi.js';

const TAB_TEAM = 'team';
const TAB_STAFF = 'staff-student';

function roleLabel(role) {
  if (role === 'admin') {
    return 'Administrator';
  }
  if (role === 'officer') {
    return 'Maintenance officer';
  }
  return role;
}

export default function InviteUsersPage() {
  const { token, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === TAB_STAFF ? TAB_STAFF : TAB_TEAM;

  function setActiveTab(tab) {
    const params = new URLSearchParams(searchParams);
    if (tab === TAB_TEAM) {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params, { replace: true });
  }

  const [team, setTeam] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamActionId, setTeamActionId] = useState(null);
  const [teamExporting, setTeamExporting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileMemberId, setProfileMemberId] = useState(null);

  const [memberStats, setMemberStats] = useState(null);
  const [memberStatsLoading, setMemberStatsLoading] = useState(false);
  const [members, setMembers] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);
  const [membersExporting, setMembersExporting] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [accountConfirm, setAccountConfirm] = useState(null);
  const [accountConfirmLoading, setAccountConfirmLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');
  const [memberSort, setMemberSort] = useState('joined');
  const [memberOrder, setMemberOrder] = useState('desc');
  const [memberPage, setMemberPage] = useState(1);

  const registerUrl = user?.organisation?.slug
    ? `${window.location.origin}/o/${user.organisation.slug}/register`
    : '';

  const loadTeam = useCallback(() => {
    setTeamLoading(true);
    Promise.all([userApi.listTeamMembers(token), userApi.getTeamStats(token)])
      .then(([listRes, statsRes]) => {
        setTeam(listRes.data);
        setTeamStats(statsRes.data);
      })
      .catch((err) => showError(err.message))
      .finally(() => setTeamLoading(false));
  }, [token, showError]);

  const loadMemberStats = useCallback(() => {
    setMemberStatsLoading(true);
    userApi
      .getOrgMemberStats(token)
      .then((res) => setMemberStats(res.data))
      .catch((err) => showError(err.message))
      .finally(() => setMemberStatsLoading(false));
  }, [token, showError]);

  const memberQuery = useMemo(
    () => ({
      page: memberPage,
      limit: 10,
      search: memberSearch.trim() || undefined,
      memberType: memberTypeFilter || undefined,
      status: memberStatusFilter || undefined,
      sort: memberSort,
      order: memberOrder
    }),
    [memberPage, memberSearch, memberTypeFilter, memberStatusFilter, memberSort, memberOrder]
  );

  const loadMembers = useCallback(() => {
    setMembersLoading(true);
    userApi
      .listOrgMembers(token, memberQuery)
      .then((res) => setMembers(res.data))
      .catch((err) => showError(err.message))
      .finally(() => setMembersLoading(false));
  }, [token, memberQuery, showError]);

  useEffect(() => {
    if (activeTab === TAB_TEAM) {
      loadTeam();
    }
  }, [activeTab, loadTeam]);

  useEffect(() => {
    if (activeTab === TAB_STAFF) {
      loadMemberStats();
    }
  }, [activeTab, loadMemberStats]);

  useEffect(() => {
    if (activeTab === TAB_STAFF) {
      loadMembers();
    }
  }, [activeTab, loadMembers]);

  const memberFiltersActive =
    Boolean(memberSearch.trim()) || Boolean(memberTypeFilter) || Boolean(memberStatusFilter);

  function clearMemberFilters() {
    setMemberSearch('');
    setMemberTypeFilter('');
    setMemberStatusFilter('');
    setMemberPage(1);
  }

  function handleInviteCreated() {
    showSuccess('Invitation link created.');
    loadTeam();
  }

  function requestAccountStatusChange(member, { isPeopleDirectory }) {
    const currentlyActive = isPeopleDirectory
      ? (member.accountStatusLabel || 'Inactive') === 'Active'
      : teamAccountStatusLabel(member) === 'Active';
    const nextActive = !currentlyActive;

    let description;
    if (nextActive) {
      description = `${member.fullName} will be able to sign in to Resolva again.`;
    } else if (isPeopleDirectory) {
      description =
        `${member.fullName} will lose access to Resolva, but their existing requests and activity history will be retained.`;
    } else {
      description = `${member.fullName} will not be able to sign in.`;
    }

    setAccountConfirm({
      member,
      isPeopleDirectory,
      nextActive,
      title: nextActive ? 'Reactivate account' : 'Disable account',
      description,
      confirmLabel: nextActive ? 'Reactivate' : 'Disable',
      variant: nextActive ? 'primary' : 'danger'
    });
  }

  async function confirmAccountStatusChange() {
    if (!accountConfirm) {
      return;
    }

    const { member, isPeopleDirectory, nextActive } = accountConfirm;
    const actionId = member.id;

    if (isPeopleDirectory) {
      setMemberActionId(actionId);
    } else {
      setTeamActionId(actionId);
    }

    setAccountConfirmLoading(true);
    try {
      await userApi.updateTeamMember(token, member.id, { isActive: nextActive });
      if (isPeopleDirectory) {
        loadMembers();
        loadMemberStats();
        showSuccess(nextActive ? 'Account reactivated.' : 'Account disabled.');
      } else {
        loadTeam();
        showSuccess(nextActive ? 'Account reactivated.' : 'Account disabled.');
      }
      setAccountConfirm(null);
    } catch (err) {
      showError(err.message);
    } finally {
      setAccountConfirmLoading(false);
      if (isPeopleDirectory) {
        setMemberActionId(null);
      } else {
        setTeamActionId(null);
      }
    }
  }

  async function handleTeamExport() {
    setTeamExporting(true);
    try {
      const res = await userApi.exportTeamMembers(token);
      const items = res.data.items || [];
      if (items.length === 0) {
        showError('No administrators or maintenance officers to export.');
        return;
      }
      downloadTeamMembersCsv(items);
      showSuccess('Team directory exported.');
    } catch (err) {
      showError(err.message);
    } finally {
      setTeamExporting(false);
    }
  }

  async function handleMembersExport() {
    setMembersExporting(true);
    try {
      const res = await userApi.exportOrgMembers(token, {
        search: memberSearch.trim() || undefined,
        memberType: memberTypeFilter || undefined,
        status: memberStatusFilter || undefined,
        sort: memberSort,
        order: memberOrder
      });
      const items = res.data.items || [];
      if (items.length === 0) {
        showError('No matching records to export.');
        return;
      }
      downloadOrgMembersCsv(items);
      showSuccess('People directory exported.');
    } catch (err) {
      showError(err.message);
    } finally {
      setMembersExporting(false);
    }
  }

  const pageDescription = activeTab === TAB_STAFF ? DESC_STAFF_STUDENTS : DESC_ADMIN_TEAM;

  const teamKpiItems = teamStats
    ? [
        { label: 'Total team members', value: teamStats.total },
        { label: 'Administrators', value: teamStats.admins },
        { label: 'Maintenance officers', value: teamStats.officers },
        { label: 'Active accounts', value: teamStats.active },
        { label: 'Inactive accounts', value: teamStats.inactive }
      ]
    : [];

  const memberKpiItems = memberStats
    ? [
        { label: 'Total people', value: memberStats.total },
        { label: 'Staff members', value: memberStats.staff },
        { label: 'Students', value: memberStats.students },
        { label: 'Active accounts', value: memberStats.active },
        { label: 'Inactive accounts', value: memberStats.inactive }
      ]
    : [];

  const csvButton = (exporting, loading, onClick) => (
    <button
      type="button"
      className="btn btn-primary"
      disabled={exporting || loading}
      onClick={onClick}
    >
      {exporting ? 'Exporting…' : 'Download CSV'}
    </button>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Team & Access"
        description={pageDescription}
        actions={
          activeTab === TAB_TEAM ? (
            <button type="button" className="btn btn-primary" onClick={() => setInviteModalOpen(true)}>
              {INVITE_TEAM_MEMBER_LABEL}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!registerUrl}
              onClick={() => setRegistrationModalOpen(true)}
            >
              {SHARE_REGISTRATION_LINK_LABEL}
            </button>
          )
        }
      />

      <nav className="admin-tabs" aria-label="Team and access sections">
        <button
          type="button"
          className={`admin-tabs__tab${activeTab === TAB_TEAM ? ' admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab(TAB_TEAM)}
        >
          {TAB_LABEL_ADMIN_TEAM}
        </button>
        <button
          type="button"
          className={`admin-tabs__tab${activeTab === TAB_STAFF ? ' admin-tabs__tab--active' : ''}`}
          onClick={() => setActiveTab(TAB_STAFF)}
        >
          {TAB_LABEL_STAFF_STUDENTS}
        </button>
      </nav>

      <InviteTeamMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        token={token}
        onInviteCreated={handleInviteCreated}
      />

      <RegistrationLinkModal
        isOpen={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        registerUrl={registerUrl}
      />

      <ConfirmActionModal
        isOpen={Boolean(accountConfirm)}
        onClose={() => {
          if (!accountConfirmLoading) {
            setAccountConfirm(null);
          }
        }}
        onConfirm={confirmAccountStatusChange}
        title={accountConfirm?.title || ''}
        description={accountConfirm?.description || ''}
        confirmLabel={accountConfirm?.confirmLabel || 'Confirm'}
        variant={accountConfirm?.variant || 'primary'}
        loading={accountConfirmLoading}
      />

      <TeamMemberProfileModal
        isOpen={Boolean(profileMemberId)}
        onClose={() => setProfileMemberId(null)}
        token={token}
        memberId={profileMemberId}
        currentUserId={user?.id}
        onMemberUpdated={loadTeam}
      />

      {activeTab === TAB_TEAM && (
        <div className="team-access-panel">
          {teamLoading && <LoadingSpinner layout="section" label="Loading summary…" />}
          {!teamLoading && teamStats && <TeamAccessStatsGrid items={teamKpiItems} />}

          <section className="card table-card team-access-directory">
            <DirectorySectionHeader
              title={TEAM_DIRECTORY_TITLE}
              description={TEAM_DIRECTORY_LEAD}
              actions={csvButton(teamExporting, teamLoading, handleTeamExport)}
            />
            {teamLoading && <LoadingSpinner layout="section" label="Loading team directory…" />}
            {!teamLoading && team.length === 0 && (
              <EmptyState
                title="No team members yet"
                message="Invite an administrator or maintenance officer to get started."
              />
            )}
            {!teamLoading && team.length > 0 && (
              <div className="table-scroll">
                <table className="data-table data-table--comfortable team-access-table">
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Email address</th>
                      <th>Role</th>
                      <th>Job title</th>
                      <th>Date joined</th>
                      <th>Account status</th>
                      <th>Officer rating</th>
                      <th className="team-access-table__actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => {
                      const statusLabel = teamAccountStatusLabel(member);
                      const isSelf = member.id === user?.id;
                      const canToggle = member.accountStatus !== 'pending' && !isSelf;
                      return (
                        <tr key={member.id}>
                          <td>
                            <button
                              type="button"
                              className="team-access-table__name-link"
                              onClick={() => setProfileMemberId(member.id)}
                            >
                              {member.fullName}
                            </button>
                          </td>
                          <td>{member.email}</td>
                          <td className="team-access-table__role">{roleLabel(member.role)}</td>
                          <td>{member.jobTitle || '—'}</td>
                          <td>{formatDisplayDate(member.createdAt)}</td>
                          <td>
                            <AccountStatusBadge label={statusLabel} />
                          </td>
                          <td>
                            {member.role === 'officer' && member.ratingCount > 0
                              ? `${member.averageRating} ★ (${member.ratingCount})`
                              : '—'}
                          </td>
                          <td className="team-access-table__actions">
                            {isSelf && <span className="team-access-table__self-label">You</span>}
                            {!isSelf && canToggle && (
                              <button
                                type="button"
                                className={`btn btn-sm ${member.isActive ? 'btn-danger-outline' : 'btn-secondary'}`}
                                disabled={teamActionId === member.id}
                                onClick={() => requestAccountStatusChange(member, { isPeopleDirectory: false })}
                              >
                                {teamActionId === member.id
                                  ? 'Saving…'
                                  : member.isActive
                                    ? 'Disable'
                                    : 'Reactivate'}
                              </button>
                            )}
                            {!isSelf && member.accountStatus === 'pending' && (
                              <span className="muted team-access-table__pending-label">Awaiting signup</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === TAB_STAFF && (
        <div className="team-access-panel">
          {memberStatsLoading && <LoadingSpinner layout="section" label="Loading summary…" />}
          {!memberStatsLoading && memberStats && <TeamAccessStatsGrid items={memberKpiItems} />}

          <div className="card filter-toolbar team-access-filters">
            <input
              type="search"
              placeholder="Search name or email"
              value={memberSearch}
              aria-label="Search staff and students"
              onChange={(e) => {
                setMemberPage(1);
                setMemberSearch(e.target.value);
              }}
            />
            <select
              value={memberTypeFilter}
              aria-label="Filter by user type"
              onChange={(e) => {
                setMemberPage(1);
                setMemberTypeFilter(e.target.value);
              }}
            >
              <option value="">All types</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
            <select
              value={memberStatusFilter}
              aria-label="Filter by account status"
              onChange={(e) => {
                setMemberPage(1);
                setMemberStatusFilter(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={`${memberSort}:${memberOrder}`}
              aria-label="Sort people directory"
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':');
                setMemberPage(1);
                setMemberSort(sort);
                setMemberOrder(order);
              }}
            >
              <option value="joined:desc">Newest first</option>
              <option value="joined:asc">Oldest first</option>
              <option value="name:asc">Name (A–Z)</option>
              <option value="name:desc">Name (Z–A)</option>
            </select>
            {memberFiltersActive && (
              <button type="button" className="btn btn-secondary" onClick={clearMemberFilters}>
                Clear filters
              </button>
            )}
          </div>

          <section className="card table-card team-access-directory">
            <DirectorySectionHeader
              title={PEOPLE_DIRECTORY_TITLE}
              description={PEOPLE_DIRECTORY_LEAD}
              actions={csvButton(membersExporting, membersLoading, handleMembersExport)}
            />
            {membersLoading && <LoadingSpinner layout="section" label="Loading people directory…" />}
            {!membersLoading && members.items.length === 0 && (
              <EmptyState
                title="No accounts found"
                message={
                  memberFiltersActive
                    ? 'Try adjusting your search or filters.'
                    : 'Staff and students will appear here after they register.'
                }
                action={
                  memberFiltersActive ? (
                    <button type="button" className="btn btn-secondary" onClick={clearMemberFilters}>
                      Clear filters
                    </button>
                  ) : null
                }
              />
            )}
            {!membersLoading && members.items.length > 0 && (
              <div className="table-scroll">
                <table className="data-table data-table--comfortable team-access-table">
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Email address</th>
                      <th>User type</th>
                      <th>Date joined</th>
                      <th>Account status</th>
                      <th className="team-access-table__actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.items.map((member) => {
                      const statusLabel = member.accountStatusLabel || 'Inactive';
                      const isActive = statusLabel === 'Active';
                      return (
                        <tr key={member.id}>
                          <td>{member.fullName}</td>
                          <td>{member.email}</td>
                          <td>{memberTypeLabel(member.memberType)}</td>
                          <td>{formatDisplayDate(member.createdAt)}</td>
                          <td>
                            <AccountStatusBadge label={statusLabel} />
                          </td>
                          <td className="team-access-table__actions">
                            <button
                              type="button"
                              className={`btn btn-sm ${isActive ? 'btn-danger-outline' : 'btn-secondary'}`}
                              disabled={memberActionId === member.id}
                              onClick={() => requestAccountStatusChange(member, { isPeopleDirectory: true })}
                            >
                              {memberActionId === member.id
                                ? 'Saving…'
                                : isActive
                                  ? 'Disable'
                                  : 'Reactivate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {!membersLoading && members.totalPages > 1 && (
            <div className="pagination team-access-pagination">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={memberPage <= 1}
                onClick={() => setMemberPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="muted">
                Page {members.page} of {members.totalPages} ({members.total} total)
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={memberPage >= members.totalPages}
                onClick={() => setMemberPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
